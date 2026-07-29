import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VocabularyList from './VocabularyList.vue';
import type { Word } from '../types';

const mockVocabulary: Word[] = [
  {
    id: '1',
    german: 'anrufen',
    english: 'to call',
    ukrainian: 'дзвонити',
    level: 'B2',
    thema: 99,
    example: 'Ich rufe an.',
    german_audio: 'anrufen.mp3',
  },
  {
    id: '2',
    german: 'schlafen',
    english: 'to sleep',
    ukrainian: 'спати',
    level: 'B1+',
    thema: 1,
    example: 'Er schläft.',
    german_audio: 'schlafen.mp3',
  },
];

describe('VocabularyList.vue', () => {
  it('renders cards up to displayLimit', () => {
    const wrapper = mount(VocabularyList, {
      props: {
        vocabulary: mockVocabulary,
        displayLimit: 1,
      },
    });

    expect(wrapper.text()).toContain('anrufen');
    expect(wrapper.text()).not.toContain('schlafen');
    expect(wrapper.text()).toContain('Explore More Vocabulary');
  });

  it('emits load-more when explore button is clicked', async () => {
    const wrapper = mount(VocabularyList, {
      props: {
        vocabulary: mockVocabulary,
        displayLimit: 1,
      },
    });

    const exploreBtn = wrapper.findAll('button').find((b) => b.text().includes('Explore More Vocabulary'));
    await exploreBtn?.trigger('click');

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('emits toggle-mastered and play-audio on button clicks', async () => {
    const wrapper = mount(VocabularyList, {
      props: {
        vocabulary: mockVocabulary,
        displayLimit: 50,
      },
    });

    const masteredBtn = wrapper.find('button[title="Mark as Mastered"]');
    await masteredBtn.trigger('click');
    expect(wrapper.emitted('toggle-mastered')?.[0]).toEqual([mockVocabulary[0]]);

    const audioBtn = wrapper.find('button[title="Play pronunciation"]');
    await audioBtn.trigger('click');
    expect(wrapper.emitted('play-audio')?.[0]).toEqual(['anrufen.mp3']);
  });
});
