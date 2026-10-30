// Cloud Gemini API with the user's own key. Tries models in order of free-tier quota.
import { safeStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storage';
import { CANCELLED, type AIServiceResponse } from './aiTypes';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const QUOTA_EXCEEDED_MESSAGE =
  'Gemini API request quota exceeded. Please wait a minute before retrying, or switch to the local WebGPU model in AI settings.';

/** Guards the x-goog-api-key header against injection. */
export const isValidApiKey = (key: string): boolean =>
  typeof key === 'string' && /^[A-Za-z0-9_-]{6,128}$/.test(key.trim());

export const getCloudKey = (): string =>
  safeStorage.getString(STORAGE_KEYS.GEMINI_API_KEY, '').trim();

export const setCloudKey = (key: string): void => {
  safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
};

// High-quota models first: gemini-flash-lite-latest (15 RPM / 500 RPD)
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

const tierScore = (name: string): number => {
  if (name.includes('flash-lite') || name.includes('flash_lite')) return 3;
  if (name.includes('flash')) return 2;
  if (name.includes('pro')) return 1;
  return 0;
};
const versionOf = (name: string): number => parseFloat(name.match(/\d+(\.\d+)?/)?.[0] || '0');

/** flash-lite-latest first, then Flash Lite → Flash → Pro, newer versions first. */
export const rankGeminiModels = (a: string, b: string): number => {
  if (a === 'gemini-flash-lite-latest') return -1;
  if (b === 'gemini-flash-lite-latest') return 1;
  return tierScore(b) - tierScore(a) || versionOf(b) - versionOf(a) || b.localeCompare(a);
};

let cachedModels: string[] | null = null;
let lastKeyForCache = '';

export const getAvailableGeminiModels = async (
  cloudKey: string,
  signal?: AbortSignal
): Promise<string[]> => {
  const sanitizedKey = cloudKey.trim();
  if (!isValidApiKey(sanitizedKey)) return DEFAULT_FALLBACK_MODELS;
  if (cachedModels?.length && lastKeyForCache === sanitizedKey) return cachedModels;

  try {
    const res = await fetch(API_BASE, { headers: { 'x-goog-api-key': sanitizedKey }, signal });
    if (res.ok) {
      const data = (await res.json()) as {
        models?: { name: string; supportedGenerationMethods?: string[] }[];
      };
      const supported = (Array.isArray(data.models) ? data.models : [])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .sort(rankGeminiModels);
      if (supported.length) {
        cachedModels = supported;
        lastKeyForCache = cloudKey;
        return supported;
      }
    }
  } catch (e: unknown) {
    console.warn('Failed to dynamically fetch Gemini model list:', e);
  }
  return DEFAULT_FALLBACK_MODELS;
};

const failure = (text: string): AIServiceResponse => ({ success: false, text, source: 'none' });

/** Asks the Gemini API, trying candidate models until one answers. */
export async function askGemini(
  apiKey: string,
  prompt: string,
  systemInstruction: string | undefined,
  signal?: AbortSignal
): Promise<AIServiceResponse> {
  const key = apiKey.trim();
  if (!isValidApiKey(key)) {
    return failure('Invalid Gemini API key format. Please check your API key in settings.');
  }
  if (signal?.aborted) return CANCELLED;

  const text = systemInstruction ? `${systemInstruction}\n\nUser request: ${prompt}` : prompt;
  let lastError = '';

  for (const model of await getAvailableGeminiModels(key, signal)) {
    if (signal?.aborted) return CANCELLED;
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429 || errData.error?.status === 'RESOURCE_EXHAUSTED') {
          // The quota is per key, so other models won't help
          console.warn(`Gemini candidate model ${model} hit rate/quota limit (429)`);
          return failure(QUOTA_EXCEEDED_MESSAGE);
        }
        lastError = errData.error?.message || `HTTP error ${response.status}`;
        console.warn(`Gemini candidate model ${model} failed (${response.status}):`, lastError);
        continue;
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (answer) return { success: true, text: answer, source: 'cloud', model };
      lastError = 'Empty response from Gemini API';
    } catch (err: unknown) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return CANCELLED;
      }
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Network attempt with ${model} failed:`, lastError);
    }
  }
  return failure(`Error calling Gemini API: ${lastError}`);
}
