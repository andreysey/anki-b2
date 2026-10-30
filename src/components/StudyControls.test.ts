import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import StudyControls from './StudyControls.vue';

enableAutoUnmount(afterEach);

const props = {
  studyDirection: 'DE_TO_UA' as const,
  isAutoplay: false,
  directionOptions: [
    { label: 'DE → EN/UA', value: 'DE_TO_UA' as const },
    { label: 'EN/UA → DE', value: 'UA_TO_DE' as const }
  ],
  audioOptions: [
    { label: 'Audio On', value: true },
    { label: 'Audio Off', value: false }
  ]
};

describe('StudyControls.vue', () => {
  it('emits direction, autoplay and shuffle changes', async () => {
    const wrapper = mount(StudyControls, { props });
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'EN/UA → DE')!
      .trigger('click');
    await wrapper.find('[aria-label="Turn audio autoplay on"]').trigger('click');
    await wrapper.find('[aria-label="Shuffle cards"]').trigger('click');
    expect(wrapper.emitted('update:studyDirection')).toEqual([['UA_TO_DE']]);
    expect(wrapper.emitted('update:isAutoplay')).toEqual([[true]]);
    expect(wrapper.emitted('shuffle')).toHaveLength(1);
  });

  it('toggles fullscreen and follows the browser state', async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request;
    const wrapper = mount(StudyControls, { props });
    const zen = wrapper.find('[aria-label="Toggle Zen mode fullscreen"]');

    await zen.trigger('click');
    expect(request).toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenElement', {
      value: document.documentElement,
      configurable: true
    });
    document.dispatchEvent(new Event('fullscreenchange'));
    await wrapper.vm.$nextTick();
    expect(zen.attributes('title')).toBe('Exit Zen Mode (Fullscreen)');
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
  });
});
