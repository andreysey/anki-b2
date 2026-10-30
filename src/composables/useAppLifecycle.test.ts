import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { useCommandPaletteShortcut, usePersistOnFreeze } from './useAppLifecycle';

const saveSRS = vi.fn();
vi.mock('./useVocabulary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./useVocabulary')>();
  return { ...actual, useVocabulary: () => ({ ...actual.useVocabulary(), saveSRS }) };
});

enableAutoUnmount(afterEach);

const host = (setup: () => void) =>
  mount(defineComponent({ setup: () => (setup(), () => h('div')) }));

describe('useAppLifecycle', () => {
  it('toggles the search palette with Ctrl+K / ⌘K and stops listening on unmount', () => {
    const isOpen = ref(false);
    const wrapper = host(() => useCommandPaletteShortcut(isOpen));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(isOpen.value).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', metaKey: true }));
    expect(isOpen.value).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(isOpen.value).toBe(false);

    wrapper.unmount();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(isOpen.value).toBe(false);
  });

  it('saves SRS progress immediately when the page is frozen', () => {
    host(() => usePersistOnFreeze());
    document.dispatchEvent(new Event('freeze'));
    expect(saveSRS).toHaveBeenCalledWith(true);
  });
});
