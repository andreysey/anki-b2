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

const savedModel = safeStorage.getString(
  STORAGE_KEYS.WEBLLM_MODEL,
  'SmolLM2-360M-Instruct-q4f32_1-MLC'
);

export const selectedLocalModel = ref<string>(savedModel);
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
