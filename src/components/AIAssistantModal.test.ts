import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VocabularyCard from './VocabularyCard.vue';
import type { Word } from '../types';

const mockWord: Word = {
  id: 'w1',
  german: '<span class="article-der">der</span> Beruf',
  german_audio: 'der Beruf',
  english: 'profession, job',
  ukrainian: 'професія',
  example: 'Er übt einen Beruf aus.',
  level: 'B2',
  thema: 1
};

describe('VocabularyCard flip and AI Assistant dialog interaction', () => {
  it('does not emit flip when gear button inside AIAssistant is clicked', async () => {
    const wrapper = mount(VocabularyCard, {
      props: {
        word: mockWord,
        isFlipped: true,
        direction: 'DE_TO_UA'
      }
    });

    const gearBtn = wrapper.find('button[title="AI Settings"]');
    expect(gearBtn.exists()).toBe(true);

    await gearBtn.trigger('click');
    expect(wrapper.emitted('flip')).toBeUndefined();
  });
});
