// Learning progress: mastered words, SRS state, daily streak — and its persistence
// (shared module-level state).
import { ref, computed } from 'vue';
import type { SRSState } from '../types';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { requestPersistentStorage } from '../utils/dataSafety';
import { getCardDueDate, reviewCard, type Rating } from '../utils/srs';
import { getItemKey } from '../utils/words';
import { migrateProgressKeys } from '../utils/progressKeys';
import { useVocabularyData } from './useVocabularyData';

export interface StudyStreakData {
  lastDate: string; // 'YYYY-MM-DD'
  streak: number;
}

const SRS_SAVE_DEBOUNCE_MS = 500;

const stored = migrateProgressKeys(
  safeStorage.getItem<string[]>(STORAGE_KEYS.MASTERED_WORDS, []),
  safeStorage.getItem<Record<string, SRSState>>(STORAGE_KEYS.SRS_DATA, {})
);
const masteredIds = ref<Set<string>>(new Set<string>(stored.masteredIds));
const srsData = ref<Record<string, SRSState>>(stored.srsData);
if (stored.changed) {
  // Progress saved by an older version: store it under the current keys
  safeStorage.setItem(STORAGE_KEYS.MASTERED_WORDS, stored.masteredIds);
  safeStorage.setItem(STORAGE_KEYS.SRS_DATA, stored.srsData);
}
const studyStreak = ref<StudyStreakData>(
  safeStorage.getItem<StudyStreakData>(STORAGE_KEYS.STUDY_STREAK, { lastDate: '', streak: 0 })
);
const sessionReviewedCount = ref(0);

// "Now" for due-card counting. A computed calling Date.now() never re-runs as time passes,
// so the app ticks this clock (every minute and when the tab becomes visible).
const dueClock = ref(Date.now());
export const tickDueClock = (): void => {
  dueClock.value = Date.now();
};

// ── Persistence ──────────────────────────────────────────────────────────────
let saveSRSTimeout: ReturnType<typeof setTimeout> | null = null;

export const flushPendingSRS = (): void => {
  if (saveSRSTimeout !== null) {
    clearTimeout(saveSRSTimeout);
    saveSRSTimeout = null;
  }
  safeStorage.setItem(STORAGE_KEYS.SRS_DATA, srsData.value);
};

/** Debounced save while grading quickly; `immediate` writes right away. */
export const saveSRS = (immediate = false): void => {
  if (immediate) {
    flushPendingSRS();
    return;
  }
  if (saveSRSTimeout !== null) clearTimeout(saveSRSTimeout);
  saveSRSTimeout = setTimeout(() => {
    saveSRSTimeout = null;
    safeStorage.setItem(STORAGE_KEYS.SRS_DATA, srsData.value);
  }, SRS_SAVE_DEBOUNCE_MS);
};

// Never lose a pending debounced save when the tab closes or goes to the background
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingSRS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingSRS();
  });
}

const saveMastered = () =>
  safeStorage.setItem(STORAGE_KEYS.MASTERED_WORDS, Array.from(masteredIds.value));

// ── Streak ───────────────────────────────────────────────────────────────────
const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const recordStudyActivity = () => {
  const now = new Date();
  const today = toDateString(now);
  const current = studyStreak.value;
  if (current.lastDate === today) return; // Already recorded activity today

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const streak = current.lastDate === toDateString(yesterday) ? (current.streak || 0) + 1 : 1;

  studyStreak.value = { lastDate: today, streak };
  safeStorage.setItem(STORAGE_KEYS.STUDY_STREAK, studyStreak.value);
  // First study of the day: make sure the browser won't wipe the progress
  void requestPersistentStorage();
};

// ── Updates ──────────────────────────────────────────────────────────────────
const recordReview = (key: string, rating: Rating) => {
  srsData.value[key] = reviewCard(srsData.value[key], rating, Date.now());
  saveSRS();
  sessionReviewedCount.value++;
  recordStudyActivity();
};

const toggleMasteredKey = (key: string) => {
  if (masteredIds.value.has(key)) masteredIds.value.delete(key);
  else masteredIds.value.add(key);
  saveMastered();
};

const restoreProgress = (newMasteredIds: string[], newSrsData: Record<string, SRSState>) => {
  // Backups made by older versions use older keys
  const restored = migrateProgressKeys(newMasteredIds, newSrsData);
  masteredIds.value = new Set<string>(restored.masteredIds);
  srsData.value = restored.srsData;
  saveMastered();
  saveSRS(true);
};

const dueCardsCount = computed(() => {
  const now = dueClock.value;
  const { vocabulary } = useVocabularyData();
  return vocabulary.value.reduce((count, item) => {
    const key = getItemKey(item);
    if (masteredIds.value.has(key)) return count;
    return getCardDueDate(srsData.value[key]) <= now ? count + 1 : count;
  }, 0);
});

export function useProgress() {
  return {
    masteredIds,
    srsData,
    studyStreak,
    sessionReviewedCount,
    dueCardsCount,
    recordReview,
    recordStudyActivity,
    toggleMasteredKey,
    restoreProgress,
    saveSRS,
    flushPendingSRS
  };
}
