import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VocabularyCardHeader from './VocabularyCardHeader.vue';
import type { Word } from '../types';

const mockWord: Word = {
  id: 'card-1',
  german: 'das Haus',
  english: 'the house',
  ukrainian: 'будинок',
  level: 'B1+',
  thema: 1,
  example: 'Das Haus ist groß.',
  german_audio: 'haus.mp3'
};

describe('VocabularyCardHeader.vue', () => {
  it('renders level badge and topic label with title tooltip', () => {
    const wrapper = mount(VocabularyCardHeader, {
      props: { word: mockWord }
    });

    expect(wrapper.text()).toContain('B1+');
    expect(wrapper.text()).toContain('Theme 1');
    const topicSpan = wrapper.findAll('span').find((s) => s.text().includes('Theme 1'));
    expect(topicSpan?.attributes('title')).toBe('Theme 1');
  });

  it('emits toggle-mastered event with word payload when mastered button is clicked', async () => {
    const wrapper = mount(VocabularyCardHeader, {
      props: { word: mockWord }
    });

    const masteredBtn = wrapper.find('button[aria-label="Mark as Mastered"]');
    expect(masteredBtn.exists()).toBe(true);
    await masteredBtn.trigger('click');

    expect(wrapper.emitted('toggle-mastered')).toBeTruthy();
    expect(wrapper.emitted('toggle-mastered')?.[0]).toEqual([mockWord]);
  });
});
