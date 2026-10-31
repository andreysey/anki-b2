// Study mode: which card is shown, its side, order (SRS-sorted or shuffled) and grading
// (shared module-level state).
import { ref, computed, watch, toRaw } from 'vue';
import type { StudyDirection, Word } from '../types';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import {
  buildDailySession,
  compareStudyCards,
  NEW_CARDS_PER_DAY,
  toLocalDateString,
  type Rating
} from '../utils/srs';
import { getItemKey } from '../utils/words';
import { useFilters, currentFilterMatcher } from './useFilters';
import { useVocabularyData } from './useVocabularyData';
import { useProgress } from './useProgress';

const isStudyMode = ref(false);
const currentStudyIndex = ref(0);
const isFlipped = ref(false);
const studyDirection = ref<StudyDirection>('DE_TO_UA');
const isAutoplay = ref<boolean>(safeStorage.getItem<boolean>(STORAGE_KEYS.AUTOPLAY, false));
const isShuffled = ref(false);
const shuffledIndices = ref<number[]>([]);

watch(isAutoplay, (on) => safeStorage.setItem(STORAGE_KEYS.AUTOPLAY, on));

// A different filter is a different deck: drop the shuffle order
const { search, levelFilter, themaFilter, filteredVocabulary } = useFilters();
watch([search, levelFilter, themaFilter], () => {
  isShuffled.value = false;
  shuffledIndices.value = [];
});

const { srsData, masteredIds, recordReview, toggleMasteredKey } = useProgress();
const { vocabulary } = useVocabularyData();

// ── Daily session ────────────────────────────────────────────────────────────
/** 'daily' = today's due cards + new ones; 'all' = every card in the current filters. */
export type SessionMode = 'daily' | 'all';
const sessionMode = ref<SessionMode>('daily');

interface DailyStudy {
  date: string;
  /** New cards reviewed for the first time today */
  newSeen: number;
  /** Extra new cards asked for today ("+10 more new") */
  extraNew: number;
}
const today = () => toLocalDateString(new Date());
const freshDay = (): DailyStudy => ({ date: today(), newSeen: 0, extraNew: 0 });
const isDailyStudy = (v: unknown): boolean => {
  const d = v as DailyStudy | null;
  return (
    !!d && typeof d.date === 'string' && Number.isFinite(d.newSeen) && Number.isFinite(d.extraNew)
  );
};
const loadDaily = (): DailyStudy => {
  const saved = safeStorage.getItem<DailyStudy | null>(
    STORAGE_KEYS.DAILY_STUDY,
    null,
    isDailyStudy
  );
  return saved && saved.date === today() ? saved : freshDay();
};
const daily = ref<DailyStudy>(loadDaily());
const saveDaily = () => safeStorage.setItem(STORAGE_KEYS.DAILY_STUDY, daily.value);

/** Starts a new day's session if the date changed (the app may stay open overnight). */
const rolloverDay = () => {
  if (daily.value.date !== today()) daily.value = freshDay();
};

/**
 * Today's session, fixed once built: it is rebuilt when filters change, on a new day, on "+10
 * more new" or a restored backup — but not when a card is graded or mastered, which would
 * reshape the list under the current index. Hence the untracked reads (toRaw).
 */
const dailySession = computed(() => {
  const { extraNew } = daily.value;
  void daily.value.date; // a new day rebuilds the session
  const reviews = toRaw(srsData.value);
  const mastered = toRaw(masteredIds.value);
  const matches = currentFilterMatcher();
  const now = Date.now();
  const candidates = vocabulary.value
    .filter((item) => !mastered.has(getItemKey(item)) && matches(item))
    .sort((a, b) => compareStudyCards(a, b, reviews, now));
  const newQuota = Math.max(0, NEW_CARDS_PER_DAY + extraNew - toRaw(daily.value).newSeen);
  return buildDailySession(candidates, reviews, now, newQuota);
});

/**
 * Filtered cards, due ones first. Sorted when the deck changes (filters, mastered words, a
 * restored backup) but not after each grade: a graded card would jump to the end while the
 * index moves forward, skipping every other card. toRaw reads the reviews without tracking them.
 */
const sortedStudyVocabulary = computed(() => {
  const now = Date.now();
  const reviews = toRaw(srsData.value);
  return [...filteredVocabulary.value].sort((a, b) => compareStudyCards(a, b, reviews, now));
});

/** The current session before shuffling. */
const baseStudyList = computed(() =>
  sessionMode.value === 'all'
    ? sortedStudyVocabulary.value
    : // Words mastered during the session leave it right away
      dailySession.value.cards.filter((item) => !masteredIds.value.has(getItemKey(item)))
);

const studyList = computed(() => {
  const list = baseStudyList.value;
  if (isShuffled.value && shuffledIndices.value.length === list.length) {
    return shuffledIndices.value.flatMap((idx) => list[idx] ?? []);
  }
  return list;
});

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

/** Past the last card: the session is finished ("Done for today"). */
const isSessionDone = computed(() => currentStudyIndex.value >= studyList.value.length);

/** Grade the current card; good/easy move on, again/hard show it again from the front. */
const updateSRS = (rating: Rating) => {
  const item = studyList.value[currentStudyIndex.value];
  if (!item) return;
  const key = getItemKey(item);
  if (!(key in srsData.value)) {
    // First review ever: counts towards today's new cards (untracked, the session stays as is)
    rolloverDay();
    toRaw(daily.value).newSeen++;
    saveDaily();
  }
  recordReview(key, rating);
  if (rating === 'good' || rating === 'easy') {
    isFlipped.value = false;
    currentStudyIndex.value++; // may step past the end: session done
  } else {
    isFlipped.value = false;
  }
};

/** "+10 more new": extends today's session with new cards. */
const addNewCards = (count = NEW_CARDS_PER_DAY) => {
  rolloverDay();
  daily.value.extraNew += count;
  saveDaily();
  sessionMode.value = 'daily';
};

const setSessionMode = (mode: SessionMode) => {
  rolloverDay();
  sessionMode.value = mode;
};

// A rebuilt session starts from its first card
watch([dailySession, sessionMode], () => {
  currentStudyIndex.value = 0;
  isFlipped.value = false;
});

// Coming back to study on another day starts that day's session
watch(isStudyMode, (studying) => {
  if (studying) rolloverDay();
});

const toggleMastered = (item: Word) => {
  toggleMasteredKey(getItemKey(item));
  // Mastering removes the card from the list; keep the index inside it
  if (isStudyMode.value && currentStudyIndex.value >= studyList.value.length) {
    currentStudyIndex.value = Math.max(0, studyList.value.length - 1);
  }
};

const shuffleCards = () => {
  isShuffled.value = !isShuffled.value;
  if (isShuffled.value) {
    const indices = Array.from({ length: baseStudyList.value.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // i and j are always within bounds (Fisher–Yates)
      [indices[i], indices[j]] = [indices[j]!, indices[i]!];
    }
    shuffledIndices.value = indices;
  } else {
    shuffledIndices.value = [];
  }
  currentStudyIndex.value = 0;
  isFlipped.value = false;
};

export function useStudySession() {
  return {
    isStudyMode,
    currentStudyIndex,
    isFlipped,
    studyDirection,
    isAutoplay,
    isShuffled,
    studyList,
    sessionMode,
    dailySession,
    isSessionDone,
    addNewCards,
    setSessionMode,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    toggleMastered
  };
}
