import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VocabularyCardFace from './VocabularyCardFace.vue';
import PrimeVue from 'primevue/config';
import type { Word } from '../types';

const mockWord: Word = {
  id: 'w1',
  german: '<span class="article-der">der</span> Beruf',
  german_audio: 'der Beruf',
  english: 'profession, job',
  ukrainian: 'професія',
  example: 'Er übt einen **wichtigen** Beruf aus.',
  level: 'B2',
  thema: 1,
};

describe('VocabularyCardFace.vue', () => {
  it('renders German text and audio button when showGerman is true', () => {
    const wrapper = mount(VocabularyCardFace, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        word: mockWord,
        showGerman: true,
      },
    });

    expect(wrapper.text()).toContain('Beruf');
    const audioBtn = wrapper.find('button[aria-label="Play German pronunciation"]');
    expect(audioBtn.exists()).toBe(true);
  });

  it('renders Ukrainian and English translations when showGerman is false', () => {
    const wrapper = mount(VocabularyCardFace, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        word: mockWord,
        showGerman: false,
      },
    });

    expect(wrapper.text()).toContain('професія');
    expect(wrapper.text()).toContain('profession, job');
  });

  it('renders example sentence and emits play-audio when example audio button is clicked', async () => {
    const wrapper = mount(VocabularyCardFace, {
      global: {
        plugins: [PrimeVue],
      },
      props: {
        word: mockWord,
        showGerman: false,
        showExample: true,
      },
    });

    expect(wrapper.text()).toContain('Er übt einen');
    const exampleAudioBtn = wrapper.find('button[aria-label="Play example sentence pronunciation"]');
    expect(exampleAudioBtn.exists()).toBe(true);

    await exampleAudioBtn.trigger('click');
    expect(wrapper.emitted('play-audio')).toBeTruthy();
    expect(wrapper.emitted('play-audio')![0]).toEqual([mockWord.example]);
  });
});
