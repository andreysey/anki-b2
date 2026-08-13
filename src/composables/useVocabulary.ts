import { ref, computed, watch } from 'vue';
import type { Word, SRSState, StudyDirection } from '../types';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';

export const SRS_INTERVALS_MS: Readonly<Record<number, number>> = {
  0: 0,                           // Immediately due
  1: 1 * 24 * 60 * 60 * 1000,    // 1 day
  2: 3 * 24 * 60 * 60 * 1000,    // 3 days
  3: 7 * 24 * 60 * 60 * 1000,    // 7 days
  4: 14 * 24 * 60 * 60 * 1000,   // 14 days
  5: 30 * 24 * 60 * 60 * 1000,   // 30 days
};

export const getCardDueDate = (srs?: SRSState): number => {
  if (!srs || srs.level === 0 || !srs.lastReview) {
    return 0; // New or reset cards are due immediately
  }
  const interval = SRS_INTERVALS_MS[srs.level] ?? SRS_INTERVALS_MS[5];
  return srs.lastReview + interval;
};

const LEVEL_TRANSITIONS: Readonly<Record<'again' | 'hard' | 'good' | 'easy', (level: number) => number>> = {
  again: () => 0,
  hard: (level) => Math.max(0, level),
  good: (level) => Math.min(5, level + 1),
  easy: (level) => Math.min(5, level + 2),
};

export const getItemKey = (item: Word): string => item.id || `${item.german}-${item.thema}`;

export const buildSearchIndex = (word: Word): string => {
  return `${word.german} ${word.english} ${word.ukrainian}`.toLowerCase();
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

const search = ref<string>('');
const levelFilter = ref<string>('all');
const themaFilter = ref<string>('all');
const displayLimit = ref<number>(50);

const isStudyMode = ref<boolean>(false);
const currentStudyIndex = ref<number>(0);
const isFlipped = ref<boolean>(false);
const studyDirection = ref<StudyDirection>('DE_TO_UA');
const isAutoplay = ref<boolean>(false);

const isShuffled = ref<boolean>(false);
const shuffledIndices = ref<number[]>([]);

// Reset display limit and shuffle when filters change
watch([search, levelFilter, themaFilter], () => {
  displayLimit.value = 50;
  isShuffled.value = false;
  shuffledIndices.value = [];
});

export function useVocabulary() {
  const init = async () => {
    if (vocabulary.value.length > 0) return; // Already loaded

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch vocabulary data: HTTP ${response.status}`);
      }
      const data: Word[] = await response.json();
      data.forEach(item => {
        if (!item._searchIndex) {
          item._searchIndex = buildSearchIndex(item);
        }
      });
      vocabulary.value = data;
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

  const filteredVocabulary = computed(() => {
    const trimmedQuery = search.value.trim().toLowerCase();

    return vocabulary.value.filter(item => {
      const searchTarget = item._searchIndex ?? buildSearchIndex(item);
      const matchesSearch = !trimmedQuery || searchTarget.includes(trimmedQuery);
      const matchesLevel = levelFilter.value === 'all' || item.level === levelFilter.value;
      const matchesThema = themaFilter.value === 'all' || item.thema.toString() === themaFilter.value;
      const isMastered = masteredIds.value.has(getItemKey(item));

      return matchesSearch && matchesLevel && matchesThema && !isMastered;
    });
  });

  // Base list of cards for study mode, sorted by SRS Due Date & Leitner Intervals
  const sortedStudyVocabulary = computed(() => {
    const list = [...filteredVocabulary.value];
    const now = Date.now();

    list.sort((a, b) => {
      const keyA = getItemKey(a);
      const keyB = getItemKey(b);
      const srsA = srsData.value[keyA];
      const srsB = srsData.value[keyB];

      const dueA = getCardDueDate(srsA);
      const dueB = getCardDueDate(srsB);

      const isDueA = dueA <= now;
      const isDueB = dueB <= now;

      // 1. Prioritize cards that are due for review now
      if (isDueA && !isDueB) return -1;
      if (!isDueA && isDueB) return 1;

      // 2. If both are due (or both not due), sort by level and then due date
      if (isDueA && isDueB) {
        const levelA = srsA?.level ?? 0;
        const levelB = srsB?.level ?? 0;
        if (levelA !== levelB) return levelA - levelB;
        return dueA - dueB;
      }

      // 3. Future cards: earliest due date first
      return dueA - dueB;
    });

    return list;
  });

  // Final study list (either sorted or shuffled)
  const studyList = computed(() => {
    const list = sortedStudyVocabulary.value;
    if (isShuffled.value && shuffledIndices.value.length === list.length) {
      return shuffledIndices.value.map(idx => list[idx]);
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
    displayLimit,
    isLoading,
    error,
    init,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    toggleMastered,
    loadMore: () => { displayLimit.value += 50 },
    getItemKey
  };
}
