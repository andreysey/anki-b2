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
