import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkWebGPUAvailability,
  supportsF16Shaders,
  getAvailableLocalModels,
  setSelectedLocalModel,
  getWebLLMEngine,
  isModelCached,
  deleteLocalModelFromCache,
  callWebLLM
} from './webllm';
import {
  selectedLocalModel,
  isModelReady,
  modelError,
  isGenerating,
  generationStatus
} from './webllmState';

vi.mock('@mlc-ai/web-llm', () => {
  class MockMLCEngine {
    opts: any;
    constructor(opts: any) {
      this.opts = opts;
    }
    async reload(modelId: string, _chatOpts: any) {
      if (modelId === 'error-model') {
        throw new Error('Failed to download model weights');
      }
      if (this.opts?.initProgressCallback) {
        this.opts.initProgressCallback({ progress: 1, text: 'Model loaded' });
      }
      return true;
    }
    unload = vi.fn().mockResolvedValue(undefined);
    chat = {
      completions: {
        create: vi.fn().mockImplementation(async (params: any) => {
          if (params.stream) {
            return (async function* () {
              yield { choices: [{ delta: { content: 'chunk 1 ' } }] };
              yield { choices: [{ delta: { content: 'chunk 2' } }] };
            })();
          }
          return {
            choices: [{ message: { content: 'AI generated explanation' } }]
          };
        })
      }
    };
  }

  return {
    MLCEngine: MockMLCEngine,
    prebuiltAppConfig: {
      model_list: [
        { model_id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', vram_required_MB: 1100 },
        { model_id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC', vram_required_MB: 800 }, // legacy
        { model_id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', vram_required_MB: 500 },
        { model_id: 'gemma3-1b-it-q4f32_1-MLC', vram_required_MB: 1200 }
      ]
    },
    hasModelInCache: vi.fn(async (id: string) => id.includes('cached')),
    deleteModelAllInfoInCache: vi.fn(async (_id: string) => true)
  };
});

describe('webllm utils', () => {
  beforeEach(() => {
    isModelReady.value = false;
    modelError.value = null;
    isGenerating.value = false;
    generationStatus.value = '';
  });

  describe('checkWebGPUAvailability & supportsF16Shaders', () => {
    it('returns false if WebGPU navigator.gpu is missing', async () => {
      // @ts-expect-error test environment
      delete navigator.gpu;
      expect(await checkWebGPUAvailability()).toBe(false);
      expect(await supportsF16Shaders()).toBe(false);
    });

    it('checks adapter and features when navigator.gpu is present', async () => {
      const mockAdapter = {
        features: new Set(['shader-f16'])
      };
      Object.defineProperty(navigator, 'gpu', {
        value: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter)
        },
        configurable: true
      });

      expect(await checkWebGPUAvailability()).toBe(true);
      expect(await supportsF16Shaders()).toBe(true);
    });
  });

  describe('getAvailableLocalModels', () => {
    it('filters out legacy models and sorts cached models first', async () => {
      const models = await getAvailableLocalModels();
      expect(models.length).toBeGreaterThan(0);
      // TinyLlama should be excluded
      expect(models.some((m) => m.id.includes('TinyLlama'))).toBe(false);
      // Llama 3.2 should be included
      expect(models.some((m) => m.id.includes('Llama-3.2'))).toBe(true);
    });
  });

  describe('setSelectedLocalModel', () => {
    it('updates selected model in state and resets engine instance', () => {
      setSelectedLocalModel('Qwen2.5-0.5B-Instruct-q4f32_1-MLC');
      expect(selectedLocalModel.value).toBe('Qwen2.5-0.5B-Instruct-q4f32_1-MLC');
    });
  });

  describe('getWebLLMEngine', () => {
    it('initializes engine successfully and sets isModelReady', async () => {
      const engine = await getWebLLMEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC');
      expect(engine).toBeDefined();
      expect(isModelReady.value).toBe(true);

      // Re-call returns cached engineInstance without reload
      const cachedEngine = await getWebLLMEngine('Llama-3.2-1B-Instruct-q4f32_1-MLC');
      expect(cachedEngine).toBe(engine);
    });

    it('sets modelError when model loading fails', async () => {
      setSelectedLocalModel('error-model');
      await expect(getWebLLMEngine('error-model')).rejects.toThrow(
        'Failed to download model weights'
      );
      expect(modelError.value).toContain('Failed to download model weights');
    });
  });

  describe('cache operations', () => {
    it('checks isModelCached via web-llm helper', async () => {
      expect(await isModelCached('model-is-cached')).toBe(true);
      expect(await isModelCached('model-fresh-not-downloaded')).toBe(false);
    });

    it('deletes model from cache and resets ready state', async () => {
      isModelReady.value = true;
      await deleteLocalModelFromCache('model-cached-1');
      expect(isModelReady.value).toBe(false);
    });
  });

  describe('callWebLLM', () => {
    it('completes inference non-streaming', async () => {
      setSelectedLocalModel('Llama-3.2-1B-Instruct-q4f32_1-MLC');
      const response = await callWebLLM('Erkläre das Wort', 'You are a German tutor.');
      expect(response).toBe('AI generated explanation');
      expect(isGenerating.value).toBe(false);
    });

    it('completes inference streaming with chunk callback', async () => {
      setSelectedLocalModel('Llama-3.2-1B-Instruct-q4f32_1-MLC');
      const chunks: string[] = [];
      const onChunk = vi.fn((chunk: string) => chunks.push(chunk));

      const response = await callWebLLM('Erkläre das Wort', undefined, onChunk);
      expect(response).toBe('chunk 1 chunk 2');
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(isGenerating.value).toBe(false);
    });
  });
});
