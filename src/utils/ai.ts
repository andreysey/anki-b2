// Helper for on-device LanguageModel API & Cloud Gemini API fallback
import { safeStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storage';

export interface AIServiceResponse {
  success: boolean;
  text: string;
  source: 'nano' | 'webllm' | 'cloud' | 'none';
  model?: string;
}

// ── Chrome built-in AI (Gemini Nano) via the Prompt API: https://developer.chrome.com/docs/ai/prompt-api
export type LanguageModelAvailability =
  'unavailable' | 'downloadable' | 'downloading' | 'available';

interface LanguageModelExpected {
  type: 'text';
  languages: string[];
}

export interface LanguageModelOptions {
  expectedInputs?: LanguageModelExpected[];
  expectedOutputs?: LanguageModelExpected[];
  initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

export interface LanguageModelSession {
  prompt: (input: string, options?: { signal?: AbortSignal }) => Promise<string>;
  promptStreaming?: (
    input: string,
    options?: { signal?: AbortSignal }
  ) => ReadableStream<string> | AsyncIterable<string>;
  destroy: () => void;
}

export interface LanguageModelStatic {
  availability: (options?: LanguageModelOptions) => Promise<LanguageModelAvailability>;
  create: (options?: LanguageModelOptions) => Promise<LanguageModelSession>;
}

/**
 * Placeholder for the answer language in prompts. Small on-device models (Gemini Nano,
 * WebLLM) write much better English than Ukrainian, and Nano doesn't support Ukrainian
 * at all, so they answer in English; the cloud Gemini API answers in Ukrainian.
 */
export const ANSWER_LANGUAGE = '{{ANSWER_LANGUAGE}}';
export const LOCAL_ANSWER_LANGUAGE = 'English';
export const CLOUD_ANSWER_LANGUAGE = 'Ukrainian';

const withLanguage = (text: string, language: string): string =>
  text.split(ANSWER_LANGUAGE).join(language);

export const ON_DEVICE_LANGUAGES: Pick<LanguageModelOptions, 'expectedInputs' | 'expectedOutputs'> =
  {
    expectedInputs: [{ type: 'text', languages: ['en', 'de'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
  };

export const isValidApiKey = (key: string): boolean => {
  return typeof key === 'string' && /^[A-Za-z0-9_\-]{6,128}$/.test(key.trim());
};

export const getCloudKey = (): string => {
  return safeStorage.getString(STORAGE_KEYS.GEMINI_API_KEY, '').trim();
};

export const setCloudKey = (key: string): void => {
  safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
};

export const getOnDeviceAIEngine = (): LanguageModelStatic | null =>
  (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel ?? null;

/**
 * True only when Gemini Nano is already downloaded and supports our languages.
 * 'downloadable' is treated as unavailable: creating a session would silently
 * start a multi-GB model download.
 */
export const checkOnDeviceSupport = async (): Promise<boolean> => {
  const engine = getOnDeviceAIEngine();
  if (!engine) return false;
  try {
    return (await engine.availability(ON_DEVICE_LANGUAGES)) === 'available';
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

export const getAvailableGeminiModels = async (
  cloudKey: string,
  signal?: AbortSignal
): Promise<string[]> => {
  const sanitizedKey = cloudKey.trim();
  if (!isValidApiKey(sanitizedKey)) {
    return DEFAULT_FALLBACK_MODELS;
  }
  if (cachedModels && cachedModels.length && lastKeyForCache === sanitizedKey) {
    return cachedModels;
  }

  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'x-goog-api-key': sanitizedKey
      },
      signal
    });
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

        if (supported.length) {
          cachedModels = supported;
          lastKeyForCache = cloudKey;
          return supported;
        }
      }
    }
  } catch (e: unknown) {
    console.warn('Failed to dynamically fetch Gemini model list:', e);
  }

  return DEFAULT_FALLBACK_MODELS;
};

export const callAI = async (
  rawPrompt: string,
  rawSystemInstruction?: string,
  onProgress?: (chunk: string, fullText: string) => void,
  signal?: AbortSignal
): Promise<AIServiceResponse> => {
  const promptText = withLanguage(rawPrompt, LOCAL_ANSWER_LANGUAGE);
  const systemInstruction =
    rawSystemInstruction && withLanguage(rawSystemInstruction, LOCAL_ANSWER_LANGUAGE);

  // 1. Try Chrome Built-in AI (Gemini Nano via the Prompt API)
  const onDeviceEngine = getOnDeviceAIEngine();
  if (onDeviceEngine && (await checkOnDeviceSupport())) {
    let session: LanguageModelSession | null = null;
    try {
      session = await onDeviceEngine.create({
        ...ON_DEVICE_LANGUAGES,
        initialPrompts: [
          {
            role: 'system',
            content: systemInstruction || 'You are a helpful German Language Coach.'
          }
        ],
        signal
      });

      let text = '';
      const stream = session.promptStreaming?.(promptText, { signal });
      if (stream && Symbol.asyncIterator in Object(stream)) {
        for await (const chunk of stream as AsyncIterable<string>) {
          text += chunk;
          onProgress?.(chunk, text);
        }
      } else if (stream && typeof (stream as ReadableStream<string>).getReader === 'function') {
        const reader = (stream as ReadableStream<string>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            text += value;
            onProgress?.(value, text);
          }
        }
      } else {
        text = await session.prompt(promptText, { signal });
      }

      return {
        success: true,
        text,
        source: 'nano',
        model: 'Gemini Nano (On-Device)'
      };
    } catch (e: unknown) {
      if (signal?.aborted) {
        return { success: false, text: 'Request cancelled', source: 'none' };
      }
      console.warn('Chrome Built-in AI failed, falling back to local WebLLM or Cloud API', e);
    } finally {
      session?.destroy();
    }
  }

  // 2. Try WebGPU Local WebLLM if model is cached/ready or WebGPU is supported
  const cloudKey = getCloudKey();
  let localModelError = '';
  try {
    const { isModelReady, isModelCached, isWebGPUSupported, callWebLLM, selectedLocalModel } =
      await import('./webllm');
    const cached = await isModelCached();
    if ((isModelReady.value || cached || !cloudKey) && isWebGPUSupported()) {
      try {
        const localText = await callWebLLM(promptText, systemInstruction, onProgress);
        if (localText) {
          return {
            success: true,
            text: localText,
            source: 'webllm',
            model: `${selectedLocalModel.value.replace(/-q[0-9]f[0-9]+.*$/, '')} (Local WebGPU)`
          };
        }
      } catch (e: unknown) {
        localModelError = e instanceof Error ? e.message : String(e);
        console.warn('Local WebLLM execution error:', localModelError);
      }
    }
  } catch (err: unknown) {
    console.warn('Local WebLLM check error:', err);
  }

  // 3. Fallback to Cloud Gemini API
  const sanitizedKey = cloudKey.trim();
  if (!sanitizedKey) {
    const errorDetail = localModelError
      ? `Local AI failed: ${localModelError}. Please check WebGPU support or configure a Gemini API key.`
      : 'No local AI model loaded and no Gemini API key configured. Open settings to load a model or enter an API key.';
    return {
      success: false,
      text: errorDetail,
      source: 'none'
    };
  }

  if (!isValidApiKey(sanitizedKey)) {
    return {
      success: false,
      text: 'Invalid Gemini API key format. Please check your API key in settings.',
      source: 'none'
    };
  }

  if (signal?.aborted) {
    return {
      success: false,
      text: 'Request cancelled',
      source: 'none'
    };
  }

  const cloudPrompt = withLanguage(rawPrompt, CLOUD_ANSWER_LANGUAGE);
  const cloudSystemInstruction =
    rawSystemInstruction && withLanguage(rawSystemInstruction, CLOUD_ANSWER_LANGUAGE);
  const formattedPrompt = cloudSystemInstruction
    ? `${cloudSystemInstruction}\n\nUser request: ${cloudPrompt}`
    : cloudPrompt;

  let lastError = '';
  const candidateModels = await getAvailableGeminiModels(sanitizedKey, signal);

  for (const model of candidateModels) {
    if (signal?.aborted) {
      return {
        success: false,
        text: 'Request cancelled',
        source: 'none'
      };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': sanitizedKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: formattedPrompt }] }]
          }),
          signal
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429 || errData.error?.status === 'RESOURCE_EXHAUSTED') {
          lastError =
            'Gemini API request quota exceeded. Please wait a minute before retrying, or switch to the local WebGPU model in AI settings.';
          console.warn(`Gemini candidate model ${model} hit rate/quota limit (429):`, lastError);
          break;
        }
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
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return {
          success: false,
          text: 'Request cancelled',
          source: 'none'
        };
      }
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Network attempt with ${model} failed:`, lastError);
    }
  }

  const errorMessage = lastError.includes('quota exceeded')
    ? lastError
    : `Error calling Gemini API: ${lastError}`;

  return {
    success: false,
    text: errorMessage,
    source: 'none'
  };
};
