import { ref, computed, watch } from 'vue';
import type { Word, SRSState, StudyDirection } from '../types';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

export const SRS_INTERVALS_MS: Readonly<Record<number, number>> = {
  0: 0, // Immediately due
  1: 1 * 24 * 60 * 60 * 1000, // 1 day
  2: 3 * 24 * 60 * 60 * 1000, // 3 days
  3: 7 * 24 * 60 * 60 * 1000, // 7 days
  4: 14 * 24 * 60 * 60 * 1000, // 14 days
  5: 30 * 24 * 60 * 60 * 1000 // 30 days
};

export const getCardDueDate = (srs?: SRSState): number => {
  if (!srs || srs.level === 0 || !srs.lastReview) {
    return 0; // New or reset cards are due immediately
  }
  const interval = SRS_INTERVALS_MS[srs.level] ?? SRS_INTERVALS_MS[5];
  return srs.lastReview + interval;
};

const LEVEL_TRANSITIONS: Readonly<
  Record<'again' | 'hard' | 'good' | 'easy', (level: number) => number>
> = {
  again: () => 0,
  hard: (level) => Math.max(0, level),
  good: (level) => Math.min(5, level + 1),
  easy: (level) => Math.min(5, level + 2)
};

export const getItemKey = (item: Word): string => item.id || `${item.german}-${item.thema}`;

export const compareStudyCards = (
  a: Word,
  b: Word,
  srsDataMap: Record<string, SRSState>,
  now: number
): number => {
  const keyA = getItemKey(a);
  const keyB = getItemKey(b);
  const srsA = srsDataMap[keyA];
  const srsB = srsDataMap[keyB];

  const dueA = getCardDueDate(srsA);
  const dueB = getCardDueDate(srsB);

  const isDueA = dueA <= now;
  const isDueB = dueB <= now;

  // 1. Prioritize cards due for review now
  if (isDueA !== isDueB) {
    return isDueA ? -1 : 1;
  }

  // 2. If both are due, sort by level and then due date
  if (isDueA) {
    const levelA = srsA?.level ?? 0;
    const levelB = srsB?.level ?? 0;
    if (levelA !== levelB) return levelA - levelB;
  }

  // 3. Earliest due date first
  return dueA - dueB;
};

export const normalizeGermanText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const normalizeToSimpleAscii = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');
};

export const buildSearchIndex = (word: Word): string => {
  const raw = `${word.german} ${word.english} ${word.ukrainian}`.toLowerCase();
  const withExpandedUmlauts = normalizeGermanText(raw);
  const withStrippedUmlauts = normalizeToSimpleAscii(raw);
  return `${raw} ${withExpandedUmlauts} ${withStrippedUmlauts}`;
};

export const matchesSearchFilter = (
  item: Word,
  rawQuery: string,
  normalizedQuery: string
): boolean => {
  if (!rawQuery) return true;
  if (!item._searchIndex) {
    item._searchIndex = buildSearchIndex(item);
  }
  return item._searchIndex.includes(rawQuery) || item._searchIndex.includes(normalizedQuery);
};

export interface StudyStreakData {
  lastDate: string; // 'YYYY-MM-DD'
  streak: number;
}

const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Module-level shared state (Singleton pattern across components)
const vocabulary = ref<Word[]>([]);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);

const masteredIds = ref<Set<string>>(
  new Set<string>(safeStorage.getItem<string[]>(STORAGE_KEYS.MASTERED_WORDS, []))
);

const srsData = ref<Record<string, SRSState>>(
  safeStorage.getItem<Record<string, SRSState>>(STORAGE_KEYS.SRS_DATA, {})
);

const studyStreak = ref<StudyStreakData>(
  safeStorage.getItem<StudyStreakData>(STORAGE_KEYS.STUDY_STREAK, { lastDate: '', streak: 0 })
);

const sessionReviewedCount = ref<number>(0);

const search = ref<string>('');
const levelFilter = ref<string>('all');
const themaFilter = ref<string>('all');
const displayLimit = ref<number>(24);

const isStudyMode = ref<boolean>(false);
const currentStudyIndex = ref<number>(0);
const isFlipped = ref<boolean>(false);
const studyDirection = ref<StudyDirection>('DE_TO_UA');
const isAutoplay = ref<boolean>(safeStorage.getItem<boolean>(STORAGE_KEYS.AUTOPLAY, false));

// Persist autoplay setting across reloads
watch(isAutoplay, (val) => {
  safeStorage.setItem(STORAGE_KEYS.AUTOPLAY, val);
});

const isShuffled = ref<boolean>(false);
const shuffledIndices = ref<number[]>([]);

// Reset display limit and shuffle when filters change
watch([search, levelFilter, themaFilter], () => {
  displayLimit.value = 24;
  isShuffled.value = false;
  shuffledIndices.value = [];
});

export function useVocabulary() {
  const recordStudyActivity = () => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const current = studyStreak.value;

    if (current.lastDate === today) {
      return; // Already recorded activity today
    }

    let newStreak = 1;
    if (current.lastDate === yesterday) {
      newStreak = (current.streak || 0) + 1;
    }

    const updated: StudyStreakData = {
      lastDate: today,
      streak: newStreak
    };
    studyStreak.value = updated;
    safeStorage.setItem(STORAGE_KEYS.STUDY_STREAK, updated);
  };

  const init = async () => {
    if (vocabulary.value.length) return; // Already loaded

    isLoading.value = true;
    error.value = null;

    try {
      let data: Word[] | null = null;
      if (typeof window !== 'undefined' && (window as unknown as { __DATA_PROMISE__?: Promise<Word[] | null> }).__DATA_PROMISE__) {
        data = await (window as unknown as { __DATA_PROMISE__: Promise<Word[] | null> }).__DATA_PROMISE__;
      }
      if (!data) {
        const response = await fetch('data.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch vocabulary data: HTTP ${response.status}`);
        }
        data = await response.json();
      }
      if (data) {
        vocabulary.value = data;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Error fetching vocabulary:', message);
      error.value = message;
    } finally {
      isLoading.value = false;
    }
  };

  const saveSRS = () => {
    safeStorage.setItem(STORAGE_KEYS.SRS_DATA, srsData.value);
  };

  const toggleMastered = (item: Word) => {
    const key = getItemKey(item);
    if (masteredIds.value.has(key)) {
      masteredIds.value.delete(key);
    } else {
      masteredIds.value.add(key);
    }
    safeStorage.setItem(STORAGE_KEYS.MASTERED_WORDS, Array.from(masteredIds.value));

    // Safety check for study index after removing a card from the list
    if (isStudyMode.value && currentStudyIndex.value >= studyList.value.length) {
      currentStudyIndex.value = Math.max(0, studyList.value.length - 1);
    }
  };

  const restoreProgress = (newMasteredIds: string[], newSrsData: Record<string, SRSState>) => {
    masteredIds.value = new Set<string>(newMasteredIds);
    srsData.value = { ...newSrsData };
    safeStorage.setItem(STORAGE_KEYS.MASTERED_WORDS, Array.from(masteredIds.value));
    saveSRS();
  };

  const filteredVocabulary = computed(() => {
    const rawQuery = search.value.trim().toLowerCase();
    const normalizedQuery = normalizeGermanText(rawQuery);

    return vocabulary.value.filter((item) => {
      if (masteredIds.value.has(getItemKey(item))) {
        return false;
      }
      if (levelFilter.value !== 'all' && item.level !== levelFilter.value) {
        return false;
      }
      if (themaFilter.value !== 'all' && item.thema.toString() !== themaFilter.value) {
        return false;
      }
      return matchesSearchFilter(item, rawQuery, normalizedQuery);
    });
  });

  // Base list of cards for study mode, sorted by SRS Due Date & Leitner Intervals
  const sortedStudyVocabulary = computed(() => {
    const list = [...filteredVocabulary.value];
    const now = Date.now();
    list.sort((a, b) => compareStudyCards(a, b, srsData.value, now));
    return list;
  });

  // Final study list (either sorted or shuffled)
  const studyList = computed(() => {
    const list = sortedStudyVocabulary.value;
    if (isShuffled.value && shuffledIndices.value.length === list.length) {
      return shuffledIndices.value.map((idx) => list[idx]);
    }
    return list;
  });

  const updateSRS = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const item = studyList.value[currentStudyIndex.value];
    if (!item) return;

    const key = getItemKey(item);
    const current = srsData.value[key] || { level: 0, lastReview: 0 };

    const newLevel = LEVEL_TRANSITIONS[rating](current.level);

    srsData.value[key] = {
      level: newLevel,
      lastReview: Date.now()
    };
    saveSRS();

    sessionReviewedCount.value++;
    recordStudyActivity();

    if (rating === 'good' || rating === 'easy') {
      nextCard();
    } else {
      isFlipped.value = false;
    }
  };

  const nextCard = () => {
    if (currentStudyIndex.value < studyList.value.length - 1) {
      currentStudyIndex.value++;
      isFlipped.value = false;
    }
  };

  const prevCard = () => {
    if (currentStudyIndex.value > 0) {
      currentStudyIndex.value--;
      isFlipped.value = false;
    }
  };

  const shuffleCards = () => {
    isShuffled.value = !isShuffled.value;
    if (isShuffled.value) {
      const len = sortedStudyVocabulary.value.length;
      const indices = Array.from({ length: len }, (_, i) => i);
      for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      shuffledIndices.value = indices;
    } else {
      shuffledIndices.value = [];
    }
    currentStudyIndex.value = 0;
    isFlipped.value = false;
  };

  return {
    vocabulary,
    filteredVocabulary,
    studyList,
    search,
    levelFilter,
    themaFilter,
    isStudyMode,
    currentStudyIndex,
    isFlipped,
    studyDirection,
    isAutoplay,
    isShuffled,
    masteredIds,
    srsData,
    studyStreak,
    sessionReviewedCount,
    displayLimit,
    isLoading,
    error,
    init,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    toggleMastered,
    restoreProgress,
    recordStudyActivity,
    loadMore: () => {
      displayLimit.value += 24;
    },
    getItemKey
  };
}
