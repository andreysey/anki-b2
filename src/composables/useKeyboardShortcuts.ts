import type { Ref } from 'vue';

export interface KeyboardShortcutHandlers {
  isStudyMode: Ref<boolean>;
  isFlipped: Ref<boolean>;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleMastered: () => void;
  onGrade: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!handlers.isStudyMode.value) return;

    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      handlers.onFlip();
    } else if (e.code === 'ArrowRight') {
      handlers.onNext();
    } else if (e.code === 'ArrowLeft') {
      handlers.onPrev();
    } else if (e.code === 'KeyM') {
      handlers.onToggleMastered();
    } else if (handlers.isFlipped.value) {
      if (e.key === '1') handlers.onGrade('again');
      else if (e.key === '2') handlers.onGrade('hard');
      else if (e.key === '3') handlers.onGrade('good');
      else if (e.key === '4') handlers.onGrade('easy');
    }
  };

  const register = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
  };

  const cleanup = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown);
    }
  };

  return {
    handleKeyDown,
    register,
    cleanup
  };
}
