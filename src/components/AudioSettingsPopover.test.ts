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
});
