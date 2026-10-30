import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudyActions } from './useStudyActions';
import { useVocabulary } from './useVocabulary';
import { createMockWords } from '../test-utils/fixtures';
import * as soundFx from '../utils/soundFx';

vi.mock('../components/ui/sonner/toast', () => ({
  toast: { success: vi.fn(), info: vi.fn() }
}));

describe('useStudyActions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(soundFx, 'playSoundFx').mockImplementation(() => {});
    const vocab = useVocabulary();
    vocab.vocabulary.value = createMockWords(4);
    vocab.masteredIds.value = new Set<string>();
    vocab.srsData.value = {};
    vocab.currentStudyIndex.value = 0;
    vocab.isFlipped.value = false;
  });

  it('flips the card with a sound', () => {
    const { flip } = useStudyActions();
    flip();
    expect(useVocabulary().isFlipped.value).toBe(true);
    expect(soundFx.playSoundFx).toHaveBeenCalledWith('flip');
  });

  it('plays the "again" sound only for again, "correct" otherwise', () => {
    const { grade } = useStudyActions();
    grade('again');
    grade('good');
    expect(vi.mocked(soundFx.playSoundFx).mock.calls.map((c) => c[0])).toEqual([
      'again',
      'correct'
    ]);
  });

  it('marks the current card as mastered', () => {
    const { masterCurrentCard } = useStudyActions();
    const card = useVocabulary().studyList.value[0];
    masterCurrentCard();
    expect(useVocabulary().masteredIds.value.has(card.id!)).toBe(true);
    expect(soundFx.playSoundFx).toHaveBeenCalledWith('celebrate');
  });

  it('reports progress through the study list', () => {
    const { studyProgress } = useStudyActions();
    const vocab = useVocabulary();
    const total = vocab.studyList.value.length;
    vocab.currentStudyIndex.value = 1;
    expect(studyProgress.value).toBe(Math.round((2 / total) * 100));
  });
});
