import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers onFlip when Space is pressed in study mode', () => {
    const isStudyMode = ref(true);
    const isFlipped = ref(false);
    const onFlip = vi.fn();
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onToggleMastered = vi.fn();
    const onGrade = vi.fn();

    const shortcuts = useKeyboardShortcuts({
      isStudyMode,
      isFlipped,
      onFlip,
      onNext,
      onPrev,
      onToggleMastered,
      onGrade
    });

    const event = new KeyboardEvent('keydown', { code: 'Space' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    shortcuts.handleKeyDown(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onFlip).toHaveBeenCalled();
  });

  it('ignores shortcuts when target is an input element', () => {
    const isStudyMode = ref(true);
    const isFlipped = ref(false);
    const onFlip = vi.fn();

    const shortcuts = useKeyboardShortcuts({
      isStudyMode,
      isFlipped,
      onFlip,
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onToggleMastered: vi.fn(),
      onGrade: vi.fn()
    });

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    shortcuts.handleKeyDown(event);

    expect(onFlip).not.toHaveBeenCalled();
  });

  it('triggers onNext and onPrev with Arrow keys', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();

    const shortcuts = useKeyboardShortcuts({
      isStudyMode: ref(true),
      isFlipped: ref(false),
      onFlip: vi.fn(),
      onNext,
      onPrev,
      onToggleMastered: vi.fn(),
      onGrade: vi.fn()
    });

    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('triggers onGrade with 1, 2, 3, 4 only when card is flipped', () => {
    const onGrade = vi.fn();
    const isFlipped = ref(false);

    const shortcuts = useKeyboardShortcuts({
      isStudyMode: ref(true),
      isFlipped,
      onFlip: vi.fn(),
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onToggleMastered: vi.fn(),
      onGrade
    });

    // When not flipped, grading keys should do nothing
    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(onGrade).not.toHaveBeenCalled();

    // When flipped
    isFlipped.value = true;
    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(onGrade).toHaveBeenCalledWith('again');

    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { key: '2' }));
    expect(onGrade).toHaveBeenCalledWith('hard');

    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { key: '3' }));
    expect(onGrade).toHaveBeenCalledWith('good');

    shortcuts.handleKeyDown(new KeyboardEvent('keydown', { key: '4' }));
    expect(onGrade).toHaveBeenCalledWith('easy');
  });

  it('registers and cleans up window event listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const shortcuts = useKeyboardShortcuts({
      isStudyMode: ref(true),
      isFlipped: ref(false),
      onFlip: vi.fn(),
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onToggleMastered: vi.fn(),
      onGrade: vi.fn()
    });

    shortcuts.register();
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    shortcuts.cleanup();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
