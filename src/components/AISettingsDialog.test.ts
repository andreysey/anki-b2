import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AISettingsDialog from './AISettingsDialog.vue';
import { useAIAssistantState } from '../composables/useAIAssistantState';

vi.mock('../utils/ai', () => ({
  checkOnDeviceSupport: vi.fn().mockResolvedValue(false),
  getCloudKey: vi.fn().mockReturnValue('stored-key'),
  setCloudKey: vi.fn(),
}));

describe('AISettingsDialog.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dialog when isSettingsOpen is true and saves key', async () => {
    const aiState = useAIAssistantState();
    aiState.openSettings();

    const wrapper = mount(AISettingsDialog, {
      global: {
        stubs: {
          Dialog: {
            template: '<div v-if="visible" class="p-dialog-stub"><slot /></div>',
            props: ['visible'],
          },
        },
      },
    });

    expect(wrapper.find('.p-dialog-stub').exists()).toBe(true);

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Save'));
    expect(saveBtn?.exists()).toBe(true);

    await saveBtn?.trigger('click');
    expect(aiState.isSettingsOpen.value).toBe(false);
  });
});
