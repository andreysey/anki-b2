import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVocabulary } from './useVocabulary';
import type { Word } from '../types';

const mockWords: Word[] = [
  {
    id: '1',
    german: 'anrufen',
    english: 'to call',
    ukrainian: 'дзвонити',
    level: 'B2',
    thema: 99,
    example: 'Ich rufe an.',
    german_audio: 'anrufen.mp3',
  },
  {
    id: '2',
    german: 'schlafen',
    english: 'to sleep',
    ukrainian: 'спати',
    level: 'B1+',
    thema: 1,
    example: 'Er schläft.',
    german_audio: 'schlafen.mp3',
  },
];

describe('useVocabulary composable', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    const vocab = useVocabulary();
    vocab.vocabulary.value = [];
    vocab.masteredIds.value.clear();
    vocab.srsData.value = {};
    vocab.search.value = '';
    vocab.levelFilter.value = 'all';
    vocab.themaFilter.value = 'all';
    vocab.currentStudyIndex.value = 0;
    vocab.isShuffled.value = false;
    vocab.displayLimit.value = 50;
  });

  it('initializes vocabulary via init fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockWords,
    } as Response);

    const vocab = useVocabulary();
    await vocab.init();
    expect(vocab.vocabulary.value.length).toBe(2);
    expect(vocab.filteredVocabulary.value.length).toBe(2);
    expect(vocab.isLoading.value).toBe(false);
    expect(vocab.error.value).toBeNull();
  });

  it('filters vocabulary by search query', async () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    vocab.search.value = 'schlafen';
    expect(vocab.filteredVocabulary.value.length).toBe(1);
    expect(vocab.filteredVocabulary.value[0].german).toBe('schlafen');

    vocab.search.value = 'дзвонити';
    expect(vocab.filteredVocabulary.value.length).toBe(1);
    expect(vocab.filteredVocabulary.value[0].german).toBe('anrufen');
  });

  it('filters vocabulary by CEFR level filter', async () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    vocab.levelFilter.value = 'B1+';
    expect(vocab.filteredVocabulary.value.length).toBe(1);
    expect(vocab.filteredVocabulary.value[0].level).toBe('B1+');
  });

  it('toggles mastered status and excludes mastered words from filtered list', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    expect(vocab.filteredVocabulary.value.length).toBe(2);
    vocab.toggleMastered(mockWords[0]);

    expect(vocab.masteredIds.value.has('1')).toBe(true);
    expect(vocab.filteredVocabulary.value.length).toBe(1);
    expect(vocab.filteredVocabulary.value[0].id).toBe('2');
  });

  it('updates SRS rating levels correctly', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    // First card: '1'
    vocab.updateSRS('good');
    expect(vocab.currentStudyIndex.value).toBe(1);

    const savedSRS = JSON.parse(localStorage.getItem('anki_srs_v2') || '{}');
    expect(savedSRS['1'].level).toBe(1);
  });

  it('handles init fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const vocab = useVocabulary();
    await vocab.init();
    expect(vocab.vocabulary.value.length).toBe(0);
    expect(vocab.error.value).toBe('Network error');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('toggles mastered status on and off', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    vocab.toggleMastered(mockWords[0]);
    expect(vocab.masteredIds.value.has('1')).toBe(true);

    vocab.toggleMastered(mockWords[0]);
    expect(vocab.masteredIds.value.has('1')).toBe(false);
  });

  it('handles SRS transitions for again, hard, easy', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    // Test 'again' rating
    vocab.isFlipped.value = true;
    vocab.updateSRS('again');
    expect(vocab.isFlipped.value).toBe(false);
    let savedSRS = JSON.parse(localStorage.getItem('anki_srs_v2') || '{}');
    expect(savedSRS['1'].level).toBe(0);

    // Test 'hard' rating
    vocab.updateSRS('hard');
    savedSRS = JSON.parse(localStorage.getItem('anki_srs_v2') || '{}');
    expect(savedSRS['1'].level).toBe(0);

    // Test 'easy' rating
    vocab.updateSRS('easy');
    savedSRS = JSON.parse(localStorage.getItem('anki_srs_v2') || '{}');
    expect(savedSRS['1'].level).toBe(2);
  });

  it('increments displayLimit when loadMore is called', () => {
    const vocab = useVocabulary();
    expect(vocab.displayLimit.value).toBe(50);
    vocab.loadMore();
    expect(vocab.displayLimit.value).toBe(100);
  });

  it('shuffles cards and resets shuffle on toggle', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    expect(vocab.isShuffled.value).toBe(false);
    vocab.shuffleCards();
    expect(vocab.isShuffled.value).toBe(true);
    expect(vocab.studyList.value.length).toBe(2);

    vocab.shuffleCards();
    expect(vocab.isShuffled.value).toBe(false);
  });

  it('navigates nextCard and prevCard correctly', () => {
    const vocab = useVocabulary();
    vocab.vocabulary.value = mockWords;

    expect(vocab.currentStudyIndex.value).toBe(0);
    vocab.nextCard();
    expect(vocab.currentStudyIndex.value).toBe(1);
    vocab.prevCard();
    expect(vocab.currentStudyIndex.value).toBe(0);
  });
});
