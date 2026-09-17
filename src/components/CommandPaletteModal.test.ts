import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CommandPaletteModal from './CommandPaletteModal.vue';
import type { Word } from '../types';

const mockVocabulary: Word[] = [
  {
    id: '1',
    german: 'die Verhandlung',
    german_audio: 'die Verhandlung',
    english: 'negotiation',
    ukrainian: 'переговори',
    example: 'Die Verhandlung war erfolgreich.',
    level: 'B2',
    thema: 1
  },
  {
    id: '2',
    german: 'der Vertrag',
    german_audio: 'der Vertrag',
    english: 'contract',
    ukrainian: 'договір',
    example: 'Er unterschreibt den Vertrag.',
    level: 'B2',
    thema: 1
  }
];

describe('CommandPaletteModal.vue', () => {
  it('renders when isOpen is true and filters words by query', async () => {
    const wrapper = mount(CommandPaletteModal, {
      props: {
        isOpen: true,
        vocabulary: mockVocabulary,
        masteredIds: new Set<string>()
      }
    });

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);

    const input = wrapper.find('input[type="text"]');
    await input.setValue('vertrag');

    expect(wrapper.text()).toContain('der Vertrag');
    expect(wrapper.text()).not.toContain('die Verhandlung');
  });

  it('emits select-word on Enter or click', async () => {
    const wrapper = mount(CommandPaletteModal, {
      props: {
        isOpen: true,
        vocabulary: mockVocabulary,
        masteredIds: new Set<string>()
      }
    });

    const item = wrapper.find('.cursor-pointer');
    expect(item.exists()).toBe(true);
    await item.trigger('click');

    expect(wrapper.emitted('select-word')).toBeTruthy();
    expect(wrapper.emitted('select-word')?.[0][0]).toEqual(mockVocabulary[0]);
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });

  it('closes on Escape key', async () => {
    const wrapper = mount(CommandPaletteModal, {
      props: {
        isOpen: true,
        vocabulary: mockVocabulary,
        masteredIds: new Set<string>()
      }
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });
});
