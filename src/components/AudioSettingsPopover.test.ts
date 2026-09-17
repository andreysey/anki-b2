import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AudioSettingsPopover from './AudioSettingsPopover.vue';

describe('AudioSettingsPopover.vue', () => {
  const defaultProps = {
    idPrefix: 'header',
    germanVoices: [
      { voiceURI: 'v1', name: 'German Voice 1', lang: 'de-DE' },
      { voiceURI: 'v2', name: 'German Voice 2', lang: 'de-AT' }
    ],
    selectedVoiceURI: 'v1',
    ttsRate: 0.85
  };

  it('renders trigger button and toggles popover dialog on click', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: defaultProps
    });

    const triggerBtn = wrapper.find('#btn-audio-settings-header');
    expect(triggerBtn.exists()).toBe(true);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await triggerBtn.trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await triggerBtn.trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('closes popover on Escape keydown', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: defaultProps,
      attachTo: document.body
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('closes popover on click outside', async () => {
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);

    const wrapper = mount(AudioSettingsPopover, {
      props: defaultProps,
      attachTo: document.body
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    wrapper.unmount();
    document.body.removeChild(outsideEl);
  });

  it('emits update:selectedVoiceURI and update:ttsRate when changed', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: defaultProps
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');

    const select = wrapper.find('#voice-select-header');
    await select.setValue('v2');
    expect(wrapper.emitted('update:selectedVoiceURI')).toBeTruthy();
    expect(wrapper.emitted('update:selectedVoiceURI')![0]).toEqual(['v2']);

    const slider = wrapper.find('#tts-rate-header');
    await slider.setValue('1.15');
    expect(wrapper.emitted('update:ttsRate')).toBeTruthy();
    expect(wrapper.emitted('update:ttsRate')![0]).toEqual([1.15]);
  });

  it('renders disabled select with fallback message when no German voices are available', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: {
        ...defaultProps,
        germanVoices: [],
        selectedVoiceURI: ''
      }
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');
    const select = wrapper.find('#voice-select-header');
    expect(select.attributes('disabled')).toBeDefined();
    expect(select.text()).toContain('No German voice found');
  });

  it('renders reset button when ttsRate is non-default and resets to 0.85 when clicked', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: {
        ...defaultProps,
        ttsRate: 1.25
      }
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');
    const resetBtn = wrapper.find('button[aria-label="Reset speech rate to default 0.85x"]');
    expect(resetBtn.exists()).toBe(true);

    await resetBtn.trigger('click');
    expect(wrapper.emitted('update:ttsRate')).toBeTruthy();
    expect(wrapper.emitted('update:ttsRate')![0]).toEqual([0.85]);
  });

  it('provides proper ARIA slider attributes for accessibility', async () => {
    const wrapper = mount(AudioSettingsPopover, {
      props: defaultProps
    });

    await wrapper.find('#btn-audio-settings-header').trigger('click');
    const slider = wrapper.find('#tts-rate-header');
    expect(slider.attributes('aria-valuemin')).toBe('0.5');
    expect(slider.attributes('aria-valuemax')).toBe('1.5');
    expect(slider.attributes('aria-valuenow')).toBe('0.85');
    expect(slider.attributes('aria-valuetext')).toBe('0.85 times normal speed');
  });
});
