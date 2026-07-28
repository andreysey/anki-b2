import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardView from './DashboardView.vue';
import type { Word } from '../types';

const mockVocabulary: Word[] = [
  {
    id: 'w1',
    german: 'anrufen',
    english: 'to call',
    ukrainian: 'дзвонити',
    level: 'B2',
    thema: 99,
    example: '',
    german_audio: '',
  },
  {
    id: 'w2',
    german: 'arbeiten',
    english: 'to work',
    ukrainian: 'працювати',
    level: 'B2',
    thema: 1,
    example: '',
    german_audio: '',
  },
];

describe('DashboardView.vue', () => {
  it('calculates total vocabulary, mastered count and percentage', () => {
    const masteredIds = new Set<string>(['w1']);

    const wrapper = mount(DashboardView, {
      props: {
        vocabulary: mockVocabulary,
        masteredIds,
      },
    });

    expect(wrapper.text()).toContain('Total Vocabulary');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('Words Mastered');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('50%');
  });

  it('renders stats grouped by theme correctly', () => {
    const masteredIds = new Set<string>();

    const wrapper = mount(DashboardView, {
      props: {
        vocabulary: mockVocabulary,
        masteredIds,
      },
    });

    expect(wrapper.text()).toContain('Unregelmäßige Verben');
    expect(wrapper.text()).toContain('Theme 1');
  });

  it('handles empty vocabulary without crashing', () => {
    const wrapper = mount(DashboardView, {
      props: {
        vocabulary: [],
        masteredIds: new Set(),
      },
    });

    expect(wrapper.text()).toContain('Overall Progress');
    expect(wrapper.text()).toContain('0%');
  });
});
