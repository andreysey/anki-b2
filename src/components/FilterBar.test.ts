import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FilterBar from './FilterBar.vue';
import type { Word } from '../types';

const mockVocab: Word[] = [
  {
    id: '1',
    german: 'Haus',
    english: 'house',
    ukrainian: 'дім',
    level: 'B1+',
    thema: 1,
    example: '',
    german_audio: ''
  },
  {
    id: '2',
    german: 'Auto',
    english: 'car',
    ukrainian: 'авто',
    level: 'B2',
    thema: 2,
    example: '',
    german_audio: ''
  }
];

describe('FilterBar.vue', () => {
  it('renders search input and options correctly', () => {
    const wrapper = mount(FilterBar, {
      props: {
        vocabulary: mockVocab,
        search: '',
        level: 'all',
        thema: 'all',
        isStudyMode: false
      }
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.text()).toContain('Start Study');
  });

  it('emits update:isStudyMode when toggle button is clicked', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        vocabulary: mockVocab,
        search: '',
        level: 'all',
        thema: 'all',
        isStudyMode: false
      }
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.emitted('update:isStudyMode')).toBeTruthy();
    expect(wrapper.emitted('update:isStudyMode')?.[0]).toEqual([true]);
  });
});
