// AI coach backend cascade: Gemini Nano (on-device) → local WebLLM (WebGPU) → cloud Gemini API.
// Providers live in aiNano.ts, webllm.ts and aiCloud.ts; this file decides the order and
// the answer language.
import { askNano } from './aiNano';
import { askGemini, getCloudKey } from './aiCloud';
import type { AIProgressCallback, AIServiceResponse } from './aiTypes';

export type { AIServiceResponse, AISource, AIProgressCallback } from './aiTypes';
export * from './aiNano';
export {
  isValidApiKey,
  getCloudKey,
  setCloudKey,
  getAvailableGeminiModels,
  rankGeminiModels
} from './aiCloud';

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

/**
 * Tries the local WebGPU model when it is ready, already downloaded, or the only option
 * (no cloud key). Returns null to fall through; `error` explains a failed attempt.
 */
async function askLocalModel(
  prompt: string,
  systemInstruction: string | undefined,
  hasCloudKey: boolean,
  onProgress?: AIProgressCallback
): Promise<{ response: AIServiceResponse | null; error: string }> {
  try {
    const { isModelReady, isModelCached, isWebGPUSupported, callWebLLM, selectedLocalModel } =
      await import('./webllm');
    const worthTrying = isModelReady.value || (await isModelCached()) || !hasCloudKey;
    if (!worthTrying || !isWebGPUSupported()) return { response: null, error: '' };

    try {
      const text = await callWebLLM(prompt, systemInstruction, onProgress);
      if (!text) return { response: null, error: '' };
      const modelName = selectedLocalModel.value.replace(/-q[0-9]f[0-9]+.*$/, '');
      return {
        response: { success: true, text, source: 'webllm', model: `${modelName} (Local WebGPU)` },
        error: ''
      };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      console.warn('Local WebLLM execution error:', error);
      return { response: null, error };
    }
  } catch (err: unknown) {
    console.warn('Local WebLLM check error:', err);
    return { response: null, error: '' };
  }
}

export const callAI = async (
  rawPrompt: string,
  rawSystemInstruction?: string,
  onProgress?: AIProgressCallback,
  signal?: AbortSignal
): Promise<AIServiceResponse> => {
  const localPrompt = withLanguage(rawPrompt, LOCAL_ANSWER_LANGUAGE);
  const localSystem =
    rawSystemInstruction && withLanguage(rawSystemInstruction, LOCAL_ANSWER_LANGUAGE);

  // 1. Chrome built-in Gemini Nano
  const nano = await askNano(localPrompt, localSystem, onProgress, signal);
  if (nano) return nano;

  // 2. Local WebGPU model
  const cloudKey = getCloudKey();
  const local = await askLocalModel(localPrompt, localSystem, Boolean(cloudKey), onProgress);
  if (local.response) return local.response;

  // 3. Cloud Gemini API
  if (!cloudKey) {
    return {
      success: false,
      source: 'none',
      text: local.error
        ? `Local AI failed: ${local.error}. Please check WebGPU support or configure a Gemini API key.`
        : 'No local AI model loaded and no Gemini API key configured. Open settings to load a model or enter an API key.'
    };
  }
  return askGemini(
    cloudKey,
    withLanguage(rawPrompt, CLOUD_ANSWER_LANGUAGE),
    rawSystemInstruction && withLanguage(rawSystemInstruction, CLOUD_ANSWER_LANGUAGE),
    signal
  );
};
