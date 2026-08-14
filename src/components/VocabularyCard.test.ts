import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VocabularyCard from './VocabularyCard.vue';
import type { Word } from '../types';

const mockWord: Word = {
  id: 'test-1',
  german: 'das Haus',
  english: 'the house',
  ukrainian: 'дім',
  level: 'B2',
  thema: 99,
  example: 'Das Haus ist groß.',
  german_audio: 'haus.mp3'
};

describe('VocabularyCard.vue', () => {
  it('renders front side correctly in DE_TO_UA direction', () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: false,
        direction: 'DE_TO_UA'
      }
    });

    expect(wrapper.text()).toContain('das Haus');
    expect(wrapper.text()).toContain('Unregelmäßige Verben');
    expect(wrapper.text()).toContain('B2');
  });

  it('renders front side correctly in UA_TO_DE direction', () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: false,
        direction: 'UA_TO_DE'
      }
    });

    expect(wrapper.text()).toContain('дім');
    expect(wrapper.text()).toContain('the house');
  });

  it('emits flip event when card is clicked', async () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: false,
        direction: 'DE_TO_UA'
      }
    });

    await wrapper.find('.group').trigger('click');
    expect(wrapper.emitted('flip')).toBeTruthy();
  });

  it('emits toggle-mastered event when mastered button is clicked', async () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: false,
        direction: 'DE_TO_UA'
      }
    });

    const masteredBtn = wrapper.find('button[title="Mark as Mastered"]');
    await masteredBtn.trigger('click');
    expect(wrapper.emitted('toggle-mastered')).toBeTruthy();
    expect(wrapper.emitted('toggle-mastered')?.[0]).toEqual([mockWord]);
  });

  it('emits play-audio event when pronunciation button is clicked', async () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: false,
        direction: 'DE_TO_UA'
      }
    });

    const audioBtn = wrapper.find('button[title="Play pronunciation"]');
    await audioBtn.trigger('click');
    expect(wrapper.emitted('play-audio')).toBeTruthy();
    expect(wrapper.emitted('play-audio')?.[0]).toEqual(['haus.mp3']);
  });
});
