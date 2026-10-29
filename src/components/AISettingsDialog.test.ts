import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import AISettingsDialog from './AISettingsDialog.vue';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import {
  selectedLocalModel,
  isModelLoading,
  isModelReady,
  modelLoadingProgress,
  modelLoadingText
} from '../utils/webllmState';
import * as webllm from '../utils/webllm';

vi.mock('../utils/ai', () => ({
  checkOnDeviceSupport: vi.fn().mockResolvedValue(false),
  getCloudKey: vi.fn().mockReturnValue('stored-key'),
  setCloudKey: vi.fn()
}));

vi.mock('../utils/webllm', () => ({
  checkWebGPUAvailability: vi.fn(),
  getAvailableLocalModels: vi.fn(),
  isModelCached: vi.fn(),
  getWebLLMEngine: vi.fn(),
  deleteLocalModelFromCache: vi.fn()
}));

vi.mock('./ui/dialog', () => ({
  Dialog: {
    template: '<div v-if="open"><slot /></div>',
    props: ['open']
  },
  DialogContent: {
    template: '<div class="dialog-content"><slot /></div>'
  },
  DialogHeader: {
    template: '<div><slot /></div>'
  },
  DialogTitle: {
    template: '<div><slot /></div>'
  },
  DialogDescription: {
    template: '<div><slot /></div>'
  }
}));

enableAutoUnmount(afterEach);

const MODELS = [
  { id: 'small-model', name: 'Small Model', vramMB: 300, isCached: true },
  { id: 'big-model', name: 'Big Model', vramMB: 2000, isCached: false }
];

const setWebGPU = (supported: boolean) => {
  if (supported) {
    Object.defineProperty(navigator, 'gpu', { value: {}, configurable: true });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).gpu;
  }
};

const findButton = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text));

describe('AISettingsDialog.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setWebGPU(false);
    useAIAssistantState().closeSettings();
  });

  it('renders dialog when isSettingsOpen is true and saves key', async () => {
    const aiState = useAIAssistantState();
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog);

    expect(wrapper.find('.dialog-content').exists()).toBe(true);

    const saveBtn = findButton(wrapper, 'Save');
    expect(saveBtn?.exists()).toBe(true);

    await saveBtn?.trigger('click');
    expect(aiState.isSettingsOpen.value).toBe(false);
  });

  it('trims whitespace from the saved key', async () => {
    const aiState = useAIAssistantState();
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog);
    await wrapper.find('#apiKeyInput').setValue('  new-key-123  ');
    await findButton(wrapper, 'Save')?.trigger('click');

    expect(aiState.apiKey.value).toBe('new-key-123');
  });

  it('allows removing an existing API key', async () => {
    const aiState = useAIAssistantState();
    aiState.saveApiKey('test-existing-key');
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog);
    const removeBtn = wrapper
      .findAll('button')
      .find((b) => b.attributes('title')?.includes('Remove'));
    expect(removeBtn?.exists()).toBe(true);

    await removeBtn?.trigger('click');
    expect(aiState.apiKey.value).toBe('');
    expect(aiState.hasCloudKey.value).toBe(false);
  });

  it('discards unsaved key edits when reopened', async () => {
    const aiState = useAIAssistantState();
    aiState.openSettings();
    const wrapper = mount(AISettingsDialog);

    await wrapper.find('#apiKeyInput').setValue('typed-but-not-saved');
    aiState.closeSettings();
    await flushPromises();
    aiState.openSettings();
    await flushPromises();

    const input = wrapper.find('#apiKeyInput').element as HTMLInputElement;
    expect(input.value).toBe('stored-key');
  });

  it('explains how to restrict the API key to this site', () => {
    useAIAssistantState().openSettings();
    const wrapper = mount(AISettingsDialog);
    const tips = wrapper.find('details');
    expect(tips.text()).toContain('How to protect your key');
    expect(tips.text()).toContain('Generative Language API');
    expect(tips.find('code').text()).toBe(`${window.location.origin}/*`);
  });

  describe('local WebGPU model', () => {
    beforeEach(() => {
      selectedLocalModel.value = 'small-model';
      isModelLoading.value = false;
      isModelReady.value = false;
      modelLoadingProgress.value = 0;
      modelLoadingText.value = '';

      vi.mocked(webllm.checkWebGPUAvailability).mockReset().mockResolvedValue(true);
      vi.mocked(webllm.getAvailableLocalModels).mockReset().mockResolvedValue(MODELS);
      vi.mocked(webllm.isModelCached)
        .mockReset()
        .mockImplementation(async (id?: string) => id === 'small-model');
      vi.mocked(webllm.getWebLLMEngine)
        .mockReset()
        .mockResolvedValue({} as never);
      vi.mocked(webllm.deleteLocalModelFromCache).mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
      setWebGPU(false);
    });

    const mountOpen = async () => {
      setWebGPU(true);
      useAIAssistantState().openSettings();
      const wrapper = mount(AISettingsDialog);
      await flushPromises();
      return wrapper;
    };

    it('shows a notice and skips model discovery without WebGPU', async () => {
      useAIAssistantState().openSettings();
      const wrapper = mount(AISettingsDialog);
      await flushPromises();

      expect(wrapper.text()).toContain('WebGPU Unavailable');
      expect(wrapper.find('#localModelSelect').exists()).toBe(false);
      expect(webllm.getAvailableLocalModels).not.toHaveBeenCalled();
      expect(wrapper.find('[data-testid="webgpu-help"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="webgpu-help"] a').attributes('href')).toContain(
        'LOCAL_AI_GUIDE.md'
      );
    });

    it('shows help instead of the download button when WebGPU has no GPU adapter', async () => {
      vi.mocked(webllm.checkWebGPUAvailability).mockResolvedValue(false);
      const wrapper = await mountOpen();

      expect(wrapper.text()).toContain('WebGPU Unavailable');
      expect(wrapper.find('[data-testid="webgpu-help"]').exists()).toBe(true);
      expect(wrapper.find('#localModelSelect').exists()).toBe(false);
      expect(webllm.getAvailableLocalModels).not.toHaveBeenCalled();
    });

    it('hides the help when a GPU is available', async () => {
      const wrapper = await mountOpen();
      expect(wrapper.find('[data-testid="webgpu-help"]').exists()).toBe(false);
    });

    it('lists discovered models and marks downloaded ones', async () => {
      const wrapper = await mountOpen();

      const options = wrapper.findAll('#localModelSelect option');
      expect(options.map((o) => o.attributes('value'))).toEqual(['small-model', 'big-model']);
      expect(options[0].text()).toContain('✓ [Downloaded] Small Model');
      expect(options[1].text()).not.toContain('Downloaded');
      expect(options[1].text()).toContain('2000');
    });

    it('offers "Load" and "Delete" for a cached model', async () => {
      const wrapper = await mountOpen();

      expect(findButton(wrapper, 'Load & Activate Model')).toBeDefined();
      expect(findButton(wrapper, 'Delete Cached Model')).toBeDefined();
    });

    it('switches to "Download" and hides "Delete" after picking an uncached model', async () => {
      const wrapper = await mountOpen();

      await wrapper.find('#localModelSelect').setValue('big-model');
      await flushPromises();

      expect(selectedLocalModel.value).toBe('big-model');
      expect(webllm.isModelCached).toHaveBeenLastCalledWith('big-model');
      expect(findButton(wrapper, 'Download & Activate Model')).toBeDefined();
      expect(findButton(wrapper, 'Delete Cached Model')).toBeUndefined();
    });

    it('loads the selected model when the action button is clicked', async () => {
      const wrapper = await mountOpen();

      await findButton(wrapper, 'Load & Activate Model')?.trigger('click');
      await flushPromises();

      expect(webllm.getWebLLMEngine).toHaveBeenCalledWith('small-model');
    });

    it('logs and survives a failed model load', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(webllm.getWebLLMEngine).mockRejectedValue(new Error('out of VRAM'));
      const wrapper = await mountOpen();

      await findButton(wrapper, 'Load & Activate Model')?.trigger('click');
      await flushPromises();

      expect(errorSpy).toHaveBeenCalledWith('Manual WebLLM loading failed:', expect.any(Error));
      expect(findButton(wrapper, 'Load & Activate Model')).toBeDefined();
    });

    it('deletes the cached model and hides the delete button', async () => {
      const wrapper = await mountOpen();
      vi.mocked(webllm.isModelCached).mockResolvedValue(false);

      await findButton(wrapper, 'Delete Cached Model')?.trigger('click');
      await flushPromises();

      expect(webllm.deleteLocalModelFromCache).toHaveBeenCalledWith('small-model');
      expect(findButton(wrapper, 'Delete Cached Model')).toBeUndefined();
      expect(findButton(wrapper, 'Download & Activate Model')).toBeDefined();
    });

    it('shows progress and locks the controls while a model is loading', async () => {
      const wrapper = await mountOpen();
      isModelLoading.value = true;
      modelLoadingProgress.value = 42;
      await flushPromises();

      expect(wrapper.text()).toContain('Downloading model...');
      expect(wrapper.text()).toContain('42%');
      expect(wrapper.find('#localModelSelect').attributes('disabled')).toBeDefined();
      expect(findButton(wrapper, 'Activate Model')).toBeUndefined();

      modelLoadingText.value = 'Fetching shard 3/10';
      await flushPromises();
      expect(wrapper.text()).toContain('Fetching shard 3/10');
    });

    it('shows the Active badge and hides the activate button when the model is ready', async () => {
      const wrapper = await mountOpen();
      isModelReady.value = true;
      await flushPromises();

      expect(wrapper.text()).toContain('Active');
      expect(findButton(wrapper, 'Activate Model')).toBeUndefined();
    });
  });
});
