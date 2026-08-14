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
        isStudyMode: false,
        totalCount: 2,
        filteredCount: 2
      }
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.text()).toContain('Start Study');
    expect(wrapper.text()).toContain('Showing 2 of 2 words');
  });

  it('renders clear search button when search has text and clears it on click', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        vocabulary: mockVocab,
        search: 'Haus',
        level: 'all',
        thema: 'all',
        isStudyMode: false,
        totalCount: 2,
        filteredCount: 1
      }
    });

    const clearBtn = wrapper.find('button[aria-label="Clear search input"]');
    expect(clearBtn.exists()).toBe(true);
    await clearBtn.trigger('click');

    expect(wrapper.emitted('update:search')).toBeTruthy();
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['']);
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

    const button = wrapper.findAll('button').find((b) => b.text().includes('Start Study'));
    await button?.trigger('click');

    expect(wrapper.emitted('update:isStudyMode')).toBeTruthy();
    expect(wrapper.emitted('update:isStudyMode')?.[0]).toEqual([true]);
  });
});
