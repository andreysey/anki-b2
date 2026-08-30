// Helper for on-device LanguageModel API & Cloud Gemini API fallback
import { safeStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storage';

export interface AIServiceResponse {
  success: boolean;
  text: string;
  source: 'nano' | 'cloud' | 'none';
  model?: string;
}

export interface AICapabilities {
  available: 'readily' | 'after-download' | 'no';
}

export interface AILanguageModelSession {
  prompt: (input: string) => Promise<string>;
  destroy: () => void;
}

export interface AILanguageModelCreateOptions {
  systemInstruction?: string;
  monitor?: (m: { addEventListener: (event: string, cb: (e: { loaded: number; total: number }) => void) => void }) => void;
}

export interface AILanguageModel {
  create: (options?: AILanguageModelCreateOptions) => Promise<AILanguageModelSession>;
  capabilities: () => Promise<AICapabilities>;
}

// Extend Window and globalThis interface for TypeScript (W3C Prompt API & Origin Trials)
declare global {
  interface Window {
    ai?: {
      languageModel?: AILanguageModel;
      assistant?: AILanguageModel;
    };
  }
}

export const getCloudKey = (): string => {
  return safeStorage.getString(STORAGE_KEYS.GEMINI_API_KEY, '');
};

export const setCloudKey = (key: string): void => {
  safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
};

export const getOnDeviceAIEngine = (): AILanguageModel | null => {
  if (typeof window === 'undefined') return null;
  const aiObj = window.ai || (globalThis as unknown as { ai?: { languageModel?: AILanguageModel; assistant?: AILanguageModel } }).ai;
  if (!aiObj) return null;
  return aiObj.languageModel || aiObj.assistant || null;
};

export const checkOnDeviceSupport = async (): Promise<boolean> => {
  const engine = getOnDeviceAIEngine();
  if (!engine) return false;
  try {
    const caps = await engine.capabilities();
    return caps.available !== 'no';
  } catch {
    return false;
  }
};

let cachedModels: string[] | null = null;
let lastKeyForCache = '';

// High quota models: gemini-flash-lite-latest (15 RPM / 500 RPD) prioritized first
const DEFAULT_FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash-latest'
];

export const getAvailableGeminiModels = async (cloudKey: string): Promise<string[]> => {
  if (cachedModels && cachedModels.length > 0 && lastKeyForCache === cloudKey) {
    return cachedModels;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cloudKey}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const supported = data.models
          .filter(
            (m: { name?: string; supportedGenerationMethods?: string[] }) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m: { name: string }) => m.name.replace(/^models\//, ''))
          // Sorter: gemini-flash-lite-latest (#1) -> Flash Lite Tier (~500 RPD) -> Flash Tier (20 RPD) -> Pro Tier
          .sort((a: string, b: string) => {
            if (a === 'gemini-flash-lite-latest') return -1;
            if (b === 'gemini-flash-lite-latest') return 1;

            const getTierScore = (name: string) => {
              if (name.includes('flash-lite') || name.includes('flash_lite')) return 3;
              if (name.includes('flash')) return 2;
              if (name.includes('pro')) return 1;
              return 0;
            };

            const scoreA = getTierScore(a);
            const scoreB = getTierScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;

            // Within the same tier, prioritize higher version numbers (3.5 > 3.1 > 2.5)
            const aVer = parseFloat(a.match(/\d+(\.\d+)?/)?.[0] || '0');
            const bVer = parseFloat(b.match(/\d+(\.\d+)?/)?.[0] || '0');
            if (aVer !== bVer) return bVer - aVer;

            return b.localeCompare(a);
          });

        if (supported.length > 0) {
          cachedModels = supported;
          lastKeyForCache = cloudKey;
          return supported;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to dynamically fetch Gemini model list:', e);
  }

  return DEFAULT_FALLBACK_MODELS;
};

export const callAI = async (
  promptText: string,
  systemInstruction?: string
): Promise<AIServiceResponse> => {
  // 1. Try Chrome Built-in AI (Gemini Nano via W3C Prompt API)
  const onDeviceEngine = getOnDeviceAIEngine();
  if (onDeviceEngine) {
    try {
      const caps = await onDeviceEngine.capabilities();
      if (caps.available !== 'no') {
        const session = await onDeviceEngine.create({
          systemInstruction: systemInstruction || 'You are a helpful German Language Coach.'
        });
        const text = await session.prompt(promptText);
        session.destroy();
        return {
          success: true,
          text,
          source: 'nano',
          model: 'Gemini Nano (On-Device)'
        };
      }
    } catch (e) {
      console.warn('Chrome Built-in AI failed, falling back to Cloud API', e);
    }
  }

  // 2. Fallback to Cloud Gemini API
  const cloudKey = getCloudKey();
  if (!cloudKey) {
    return {
      success: false,
      text: 'No API key or Built-in AI support found.',
      source: 'none'
    };
  }

  const formattedPrompt = systemInstruction
    ? `${systemInstruction}\n\nUser request: ${promptText}`
    : promptText;

  let lastError = '';
  const candidateModels = await getAvailableGeminiModels(cloudKey);

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cloudKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: formattedPrompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastError = errData.error?.message || `HTTP error ${response.status}`;
        console.warn(`Gemini candidate model ${model} failed (${response.status}):`, lastError);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        lastError = 'Empty response from Gemini API';
        continue;
      }

      return {
        success: true,
        text,
        source: 'cloud',
        model: model
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Network attempt with ${model} failed:`, lastError);
    }
  }

  return {
    success: false,
    text: `Error calling Gemini API: ${lastError}`,
    source: 'none'
  };
};
