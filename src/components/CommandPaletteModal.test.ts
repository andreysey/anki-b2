import { describe, it, expect, afterEach } from 'vitest';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick } from 'vue';
import CommandPaletteModal from './CommandPaletteModal.vue';
import type { Word } from '../types';

// The palette listens on `window`, so leftover mounted instances would react to
// keydown events from later tests. Unmount after each test.
enableAutoUnmount(afterEach);

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
  },
  {
    id: '3',
    german: 'die Abteilung',
    german_audio: '',
    english: 'department',
    ukrainian: 'відділ',
    example: 'Unsere Abteilung wächst.',
    level: 'B1+',
    thema: 2
  }
];

const mountPalette = (props: Partial<{ isOpen: boolean; masteredIds: Set<string> }> = {}) =>
  mount(CommandPaletteModal, {
    props: {
      isOpen: true,
      vocabulary: mockVocabulary,
      masteredIds: new Set<string>(),
      ...props
    },
    attachTo: document.body
  });

const pressKey = async (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  await nextTick();
};

const selectedOption = (wrapper: ReturnType<typeof mountPalette>) =>
  wrapper.find('[role="option"][aria-selected="true"]');

describe('CommandPaletteModal.vue', () => {
  it('renders when isOpen is true and filters words by query', async () => {
    const wrapper = mountPalette();

    const input = wrapper.find('input[type="text"]');
    expect(input.exists()).toBe(true);
    await input.setValue('vertrag');

    expect(wrapper.text()).toContain('der Vertrag');
    expect(wrapper.text()).not.toContain('die Verhandlung');
  });

  it('renders nothing when closed', () => {
    const wrapper = mountPalette({ isOpen: false });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('emits select-word and closes on click', async () => {
    const wrapper = mountPalette();

    await wrapper.find('[role="option"]').trigger('click');

    expect(wrapper.emitted('select-word')?.[0][0]).toEqual(mockVocabulary[0]);
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });

  it('closes on Escape key', async () => {
    const wrapper = mountPalette();
    await pressKey('Escape');
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });

  it('closes when the backdrop is clicked', async () => {
    const wrapper = mountPalette();
    await wrapper.find('[role="dialog"]').trigger('click');
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });

  it('moves the selection with arrow keys and wraps around', async () => {
    const wrapper = mountPalette();
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-0');

    await pressKey('ArrowDown');
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-1');

    await pressKey('ArrowDown');
    await pressKey('ArrowDown');
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-0');

    await pressKey('ArrowUp');
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-2');
    expect(wrapper.find('input').attributes('aria-activedescendant')).toBe('cmd-option-2');
  });

  it('selects the highlighted word on Enter', async () => {
    const wrapper = mountPalette();

    await pressKey('ArrowDown');
    await pressKey('Enter');

    expect(wrapper.emitted('select-word')?.[0][0]).toEqual(mockVocabulary[1]);
    expect(wrapper.emitted('update:isOpen')?.[0][0]).toBe(false);
  });

  it('resets the selection when the query changes', async () => {
    const wrapper = mountPalette();
    await pressKey('ArrowDown');
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-1');

    await wrapper.find('input').setValue('ver');
    expect(selectedOption(wrapper).attributes('id')).toBe('cmd-option-0');
  });

  it('shows an empty state and ignores Enter when nothing matches', async () => {
    const wrapper = mountPalette();
    await wrapper.find('input').setValue('zzzzzz');

    expect(wrapper.find('[role="option"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No matching words found for "zzzzzz"');

    await pressKey('ArrowDown');
    await pressKey('Enter');
    expect(wrapper.emitted('select-word')).toBeUndefined();
  });

  it('ignores keyboard shortcuts while closed', async () => {
    const wrapper = mountPalette({ isOpen: false });
    await pressKey('Escape');
    await pressKey('Enter');
    expect(wrapper.emitted('update:isOpen')).toBeUndefined();
    expect(wrapper.emitted('select-word')).toBeUndefined();
  });

  it('toggles mastered without selecting the word', async () => {
    const wrapper = mountPalette();
    const masteredButton = wrapper.findAll('[role="option"]')[1].find('button[title]');

    await masteredButton.trigger('click');

    expect(wrapper.emitted('toggle-mastered')?.[0][0]).toEqual(mockVocabulary[1]);
    expect(wrapper.emitted('select-word')).toBeUndefined();
  });

  it('shows mastered state from masteredIds', () => {
    const wrapper = mountPalette({ masteredIds: new Set(['2']) });
    const titles = wrapper
      .findAll('[role="option"]')
      .map((o) => o.find('button[title]').attributes('title'));
    expect(titles).toEqual(['Mark as mastered', 'Mastered', 'Mark as mastered']);
  });

  it('plays audio, falling back to the german text when german_audio is empty', async () => {
    const wrapper = mountPalette();
    const options = wrapper.findAll('[role="option"]');

    await options[0].find('button[title="Pronounce"]').trigger('click');
    await options[2].find('button[title="Pronounce"]').trigger('click');

    expect(wrapper.emitted('play-audio')).toEqual([['die Verhandlung'], ['die Abteilung']]);
    expect(wrapper.emitted('select-word')).toBeUndefined();
  });

  it('focuses the input on open, clears the old query, and restores focus on close', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mountPalette({ isOpen: false });
    await wrapper.setProps({ isOpen: true });
    await nextTick();

    const input = wrapper.find('input').element as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    await wrapper.find('input').setValue('vertrag');

    await wrapper.setProps({ isOpen: false });
    expect(document.activeElement).toBe(trigger);

    await wrapper.setProps({ isOpen: true });
    await nextTick();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');

    trigger.remove();
  });
});
