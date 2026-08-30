import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AISettingsDialog from './AISettingsDialog.vue';
import { useAIAssistantState } from '../composables/useAIAssistantState';

vi.mock('../utils/ai', () => ({
  checkOnDeviceSupport: vi.fn().mockResolvedValue(false),
  getCloudKey: vi.fn().mockReturnValue('stored-key'),
  setCloudKey: vi.fn()
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

describe('AISettingsDialog.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dialog when isSettingsOpen is true and saves key', async () => {
    const aiState = useAIAssistantState();
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog);

    expect(wrapper.find('.dialog-content').exists()).toBe(true);

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'));
    expect(saveBtn?.exists()).toBe(true);

    await saveBtn?.trigger('click');
    expect(aiState.isSettingsOpen.value).toBe(false);
  });

  it('allows removing an existing API key', async () => {
    const aiState = useAIAssistantState();
    aiState.saveApiKey('test-existing-key');
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog);
    const removeBtn = wrapper.findAll('button').find((b) => b.attributes('title')?.includes('Remove'));
    expect(removeBtn?.exists()).toBe(true);

    await removeBtn?.trigger('click');
    expect(aiState.apiKey.value).toBe('');
    expect(aiState.hasCloudKey.value).toBe(false);
  });
});
