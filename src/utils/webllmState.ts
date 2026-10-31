import { ref } from 'vue';
import { safeStorage } from './storage';
import { STORAGE_KEYS } from '../constants/storage';

export interface LocalModelOption {
  id: string;
  name: string;
  vramMB: number;
  isCached?: boolean;
}

export const isWebGPUSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu;
};

// Multilingual defaults (the coach answers in Ukrainian, which SmolLM2 handles poorly).
// Gemma 3 1B only ships as f16; GPUs without shader-f16 get Qwen3.5 0.8B in f32.
export const DEFAULT_MODEL_F16 = 'gemma3-1b-it-q4f16_1-MLC';
export const DEFAULT_MODEL_F32 = 'Qwen3.5-0.8B-q4f32_1-MLC';

/** True once the user picked a model themselves; then we never override their choice. */
export const hasUserSelectedModel = (): boolean =>
  !!safeStorage.getString(STORAGE_KEYS.WEBLLM_MODEL, '');

export const selectedLocalModel = ref<string>(
  safeStorage.getString(STORAGE_KEYS.WEBLLM_MODEL, '') || DEFAULT_MODEL_F32
);
export const isModelLoading = ref<boolean>(false);
export const modelLoadingProgress = ref<number>(0);
export const modelLoadingText = ref<string>('');
export const isModelReady = ref<boolean>(false);
export const modelError = ref<string | null>(null);
export const isGenerating = ref<boolean>(false);
export const generationStatus = ref<string>('');

export const setSelectedLocalModel = (modelId: string): void => {
  selectedLocalModel.value = modelId;
  safeStorage.setItem(STORAGE_KEYS.WEBLLM_MODEL, modelId);
  isModelReady.value = false;
};

/**
 * Whether the model's files are already downloaded — without loading WebLLM itself (~6 MB).
 * WebLLM keeps weights in Cache Storage "webllm/model" under URLs containing the model id
 * (https://huggingface.co/mlc-ai/<model-id>/resolve/main/…).
 */
export const hasLocalModelFiles = async (
  modelId: string = selectedLocalModel.value
): Promise<boolean> => {
  try {
    if (typeof caches === 'undefined' || !(await caches.has('webllm/model'))) return false;
    const keys = await (await caches.open('webllm/model')).keys();
    return keys.some((request) => request.url.includes(`/${modelId}/`));
  } catch {
    return false;
  }
};
