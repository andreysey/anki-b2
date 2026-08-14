import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StudyView from './StudyView.vue';
import type { Word, SelectOption, StudyDirection } from '../types';

const mockWords: Word[] = [
  {
    id: '1',
    german: 'anrufen',
    english: 'to call',
    ukrainian: 'дзвонити',
    level: 'B2',
    thema: 99,
    example: 'Ich rufe an.',
    german_audio: 'anrufen.mp3'
  }
];

const directionOptions: SelectOption<StudyDirection>[] = [
  { label: 'DE', value: 'DE_TO_UA' },
  { label: 'UA', value: 'UA_TO_DE' }
];

const audioOptions = [
  { label: 'Audio On', value: true },
  { label: 'Audio Off', value: false }
];

describe('StudyView.vue', () => {
  it('renders study controls, progress bar and navigation', () => {
    const wrapper = mount(StudyView, {
      props: {
        vocabulary: mockWords,
        currentStudyIndex: 0,
        isFlipped: false,
        studyDirection: 'DE_TO_UA',
        isAutoplay: true,
        studyProgress: 100,
        directionOptions,
        audioOptions,
        sessionReviewedCount: 3
      }
    });

    expect(wrapper.text()).toContain('Shuffle');
    expect(wrapper.text()).toContain('1 / 1');
    expect(wrapper.text()).toContain('3 reviewed');
    expect(wrapper.text()).toContain('flip');
  });

  it('renders SRS rating buttons when card is flipped', async () => {
    const wrapper = mount(StudyView, {
      props: {
        vocabulary: mockWords,
        currentStudyIndex: 0,
        isFlipped: true,
        studyDirection: 'DE_TO_UA',
        isAutoplay: true,
        studyProgress: 100,
        directionOptions,
        audioOptions
      }
    });

    expect(wrapper.text()).toContain('AGAIN (1)');
    expect(wrapper.text()).toContain('HARD (2)');
    expect(wrapper.text()).toContain('GOOD (3)');
    expect(wrapper.text()).toContain('EASY (4)');

    const againBtn = wrapper.findAll('button').find((b) => b.text().includes('AGAIN'));
    await againBtn?.trigger('click');
    expect(wrapper.emitted('update-srs')?.[0]).toEqual(['again']);
  });

  it('emits shuffle, prev, and next events on button click', async () => {
    const wrapper = mount(StudyView, {
      props: {
        vocabulary: mockWords,
        currentStudyIndex: 0,
        isFlipped: false,
        studyDirection: 'DE_TO_UA',
        isAutoplay: true,
        studyProgress: 100,
        directionOptions,
        audioOptions
      }
    });

    const shuffleBtn = wrapper.findAll('button').find((b) => b.text().includes('Shuffle'));
    await shuffleBtn?.trigger('click');
    expect(wrapper.emitted('shuffle')).toBeTruthy();

    const buttons = wrapper.findAll('button');
    const prevBtn = buttons[buttons.length - 2];
    const nextBtn = buttons[buttons.length - 1];

    await prevBtn.trigger('click');
    expect(wrapper.emitted('prev')).toBeTruthy();

    await nextBtn.trigger('click');
    expect(wrapper.emitted('next')).toBeTruthy();
  });
});
