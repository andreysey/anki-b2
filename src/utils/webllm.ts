// Lightweight on-demand WebLLM engine with WebGPU support
import type { MLCEngineInterface } from '@mlc-ai/web-llm';
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

export const checkWebGPUAvailability = async (): Promise<boolean> => {
  if (!isWebGPUSupported()) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
};

// Check if current device/browser WebGPU adapter supports shader-f16
export const supportsF16Shaders = async (): Promise<boolean> => {
  if (!isWebGPUSupported()) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!(adapter && adapter.features.has('shader-f16'));
  } catch {
    return false;
  }
};

// Dynamically fetch and filter modern, active compact models from web-llm registry
export const getAvailableLocalModels = async (): Promise<LocalModelOption[]> => {
  try {
    const { prebuiltAppConfig, hasModelInCache } = await import('@mlc-ai/web-llm');
    const f16Supported = await supportsF16Shaders();

    const filtered = prebuiltAppConfig.model_list.filter((m) => {
      const id = m.model_id;
      const vram = m.vram_required_MB || 0;

      // Exclude legacy models (RedPajama, Vicuna, WizardLM, TinyLlama, old Llama-2, Mistral-v0.2, etc.)
      const isLegacy =
        id.includes('RedPajama') ||
        id.includes('vicuna') ||
        id.includes('Wizard') ||
        id.includes('TinyLlama') ||
        id.includes('stablelm') ||
        id.includes('Llama-2') ||
        id.includes('Mistral-7B-Instruct-v0.2') ||
        id.includes('jpn') ||
        id.includes('Coder') ||
        id.includes('Math') ||
        id.includes('-1k');

      // Only modern stable lightweight architectures (excluding experimental broken wasm binaries)
      const isModern =
        id.startsWith('Llama-3.2-1B') ||
        id.startsWith('Llama-3.2-3B') ||
        id.startsWith('Qwen2.5-0.5B') ||
        id.startsWith('Qwen2.5-1.5B') ||
        id.startsWith('Qwen3-0.6B') ||
        id.startsWith('Qwen3.5-0.8B') ||
        id.startsWith('gemma-2-2b') ||
        id.startsWith('Phi-4-mini') ||
        id.startsWith('SmolLM2-360M') ||
        id.startsWith('SmolLM2-1.7B');

      // If f16 is not supported by GPU, filter for universal 32-bit (q4f32_1)
      const isCompatibleQuant = f16Supported
        ? id.includes('q4f16_1') || id.includes('q4f32_1')
        : id.includes('q4f32_1');

      return !isLegacy && isModern && isCompatibleQuant && vram <= 3600;
    });

    const models = await Promise.all(
      filtered.map(async (m) => {
        const isF32 = m.model_id.includes('q4f32');
        const cleanName = m.model_id
          .replace(/-q[0-9]f[0-9]+.*$/, '')
          .replace(/-MLC$/, '');
        let isCached = false;
        try {
          isCached = await hasModelInCache(m.model_id);
        } catch {
          isCached = false;
        }

        return {
          id: m.model_id,
          name: isF32 ? `${cleanName} (Universal 32-bit)` : cleanName,
          vramMB: Math.round(m.vram_required_MB || 0),
          isCached
        };
      })
    );

    // Sort: cached models first, then by VRAM
    return models.sort((a, b) => {
      if (a.isCached && !b.isCached) return -1;
      if (!a.isCached && b.isCached) return 1;
      return a.vramMB - b.vramMB;
    });
  } catch (err) {
    console.warn('Failed to dynamically load WebLLM model list:', err);
    return [
      { id: 'SmolLM2-360M-Instruct-q4f32_1-MLC', name: 'SmolLM2-360M-Instruct (Universal 32-bit)', vramMB: 580, isCached: false },
      { id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', name: 'Llama-3.2-1B-Instruct (Universal 32-bit)', vramMB: 1128, isCached: false },
      { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', name: 'Qwen2.5-0.5B-Instruct (Universal 32-bit)', vramMB: 1060, isCached: false },
      { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', name: 'SmolLM2-360M-Instruct', vramMB: 376, isCached: false }
    ];
  }
};

const savedModel = safeStorage.getString(
  STORAGE_KEYS.WEBLLM_MODEL,
  'SmolLM2-360M-Instruct-q4f32_1-MLC'
);

export const selectedLocalModel = ref<string>(savedModel);

export const setSelectedLocalModel = (modelId: string): void => {
  selectedLocalModel.value = modelId;
  safeStorage.setItem(STORAGE_KEYS.WEBLLM_MODEL, modelId);
  // Reset engine instance if switching models
  engineInstance = null;
  isModelReady.value = false;
};

let engineInstance: MLCEngineInterface | null = null;

export const isModelLoading = ref<boolean>(false);
export const modelLoadingProgress = ref<number>(0);
export const modelLoadingText = ref<string>('');
export const isModelReady = ref<boolean>(false);
export const modelError = ref<string | null>(null);

export const getWebLLMEngine = async (modelId?: string): Promise<MLCEngineInterface> => {
  const targetModel = modelId || selectedLocalModel.value;

  if (engineInstance && isModelReady.value) {
    return engineInstance;
  }

  isModelLoading.value = true;
  modelLoadingProgress.value = 0;
  modelLoadingText.value = `Initializing ${targetModel}...`;
  modelError.value = null;

  try {
    const { MLCEngine, prebuiltAppConfig } = await import('@mlc-ai/web-llm');

    // Fix upstream WebLLM config conflict where Gemma 3 defines both positive context_window and sliding_window
    const customAppConfig = {
      ...prebuiltAppConfig,
      model_list: prebuiltAppConfig.model_list.map((m) => {
        if (m.model_id.includes('gemma3-1b')) {
          return {
            ...m,
            overrides: {
              ...m.overrides,
              sliding_window_size: -1
            }
          };
        }
        return m;
      })
    };

    const engine = new MLCEngine({
      appConfig: customAppConfig,
      initProgressCallback: (report) => {
        modelLoadingProgress.value = Math.round(report.progress * 100);
        modelLoadingText.value = report.text;
      }
    });

    const chatOpts = targetModel.includes('gemma3-1b') ? { sliding_window_size: -1 } : undefined;
    await engine.reload(targetModel, chatOpts);
    engineInstance = engine;

    isModelReady.value = true;
    return engineInstance;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    modelError.value = msg;
    console.error(`Failed to load WebLLM model (${targetModel}):`, msg);
    throw err;
  } finally {
    isModelLoading.value = false;
  }
};

export const isModelCached = async (modelId?: string): Promise<boolean> => {
  const target = modelId || selectedLocalModel.value;
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm');
    return await hasModelInCache(target);
  } catch {
    return false;
  }
};

export const deleteLocalModelFromCache = async (modelId?: string): Promise<void> => {
  const target = modelId || selectedLocalModel.value;
  try {
    const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
    await deleteModelAllInfoInCache(target);
    if (engineInstance) {
      engineInstance = null;
    }
    isModelReady.value = false;
  } catch (err) {
    console.error(`Failed to delete model ${target} from cache:`, err);
    throw err;
  }
};

export const isGenerating = ref<boolean>(false);
export const generationStatus = ref<string>('');

export const callWebLLM = async (
  promptText: string,
  systemInstruction?: string,
  onChunk?: (chunk: string, fullText: string) => void
): Promise<string> => {
  generationStatus.value = 'Preparing model engine...';
  const engine = await getWebLLMEngine();

  const messages = [
    ...(systemInstruction
      ? [{ role: 'system' as const, content: systemInstruction }]
      : []),
    { role: 'user' as const, content: promptText }
  ];

  isGenerating.value = true;
  generationStatus.value = 'Thinking & compiling context...';

  try {
    if (onChunk) {
      generationStatus.value = 'Generating response tokens...';
      const asyncChunkGenerator = await engine.chat.completions.create({
        messages,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.18,
        max_tokens: 512,
        stream: true
      });

      let accumulated = '';
      for await (const chunk of asyncChunkGenerator) {
        const textDelta = chunk.choices[0]?.delta?.content || '';
        if (textDelta) {
          accumulated += textDelta;
          onChunk(textDelta, accumulated);
        }
      }
      return accumulated;
    } else {
      generationStatus.value = 'Inferring response...';
      const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.18,
        max_tokens: 512
      });

      return reply.choices[0]?.message?.content || '';
    }
  } finally {
    isGenerating.value = false;
    generationStatus.value = '';
  }
};
