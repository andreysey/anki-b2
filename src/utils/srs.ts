// Spaced-repetition scheduling (Leitner boxes 0–5). Pure functions, no Vue or storage,
// so the algorithm can be tested — or replaced (e.g. by FSRS) — in one place.
import type { Word, SRSState } from '../types';
import { getItemKey } from './words';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

const DAY_MS = 24 * 60 * 60 * 1000;

export const SRS_INTERVALS_MS: Readonly<Record<number, number>> = {
  0: 0, // Immediately due
  1: 1 * DAY_MS,
  2: 3 * DAY_MS,
  3: 7 * DAY_MS,
  4: 14 * DAY_MS,
  5: 30 * DAY_MS
};
const MAX_LEVEL = 5;
const MAX_SRS_INTERVAL_MS = 30 * DAY_MS;

export const getCardDueDate = (srs?: SRSState): number => {
  if (
    !srs ||
    !Number.isFinite(srs.level) ||
    srs.level <= 0 ||
    !Number.isFinite(srs.lastReview) ||
    srs.lastReview <= 0
  ) {
    return 0; // New or reset cards are due immediately
  }
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(srs.level)));
  return srs.lastReview + (SRS_INTERVALS_MS[safeLevel] ?? MAX_SRS_INTERVAL_MS);
};

const LEVEL_TRANSITIONS: Readonly<Record<Rating, (level: number) => number>> = {
  again: () => 0,
  hard: (level) => Math.max(0, level),
  good: (level) => Math.min(MAX_LEVEL, level + 1),
  easy: (level) => Math.min(MAX_LEVEL, level + 2)
};

/** New state after reviewing a card. */
export const reviewCard = (
  current: SRSState | undefined,
  rating: Rating,
  now: number
): SRSState => ({
  level: LEVEL_TRANSITIONS[rating](current?.level ?? 0),
  lastReview: now
});

/** Due cards first (lowest level first), then by earliest due date. */
export const compareStudyCards = (
  a: Word,
  b: Word,
  srsDataMap: Record<string, SRSState>,
  now: number
): number => {
  const srsA = srsDataMap[getItemKey(a)];
  const srsB = srsDataMap[getItemKey(b)];
  const dueA = getCardDueDate(srsA);
  const dueB = getCardDueDate(srsB);
  const isDueA = dueA <= now;
  const isDueB = dueB <= now;

  if (isDueA !== isDueB) return isDueA ? -1 : 1;
  if (isDueA) {
    const levelDiff = (srsA?.level ?? 0) - (srsB?.level ?? 0);
    if (levelDiff) return levelDiff;
  }
  return dueA - dueB;
};

/** New cards introduced per day in the daily session. */
export const NEW_CARDS_PER_DAY = 10;

/**
 * Today's session from cards already in study order: every card that was reviewed before and is
 * due now, then up to `newQuota` cards never reviewed.
 */
export const buildDailySession = (
  sortedCards: Word[],
  reviews: Record<string, SRSState>,
  now: number,
  newQuota: number
): { cards: Word[]; dueCount: number; newCount: number; newLeft: number } => {
  const due: Word[] = [];
  const fresh: Word[] = [];
  let neverReviewed = 0;
  for (const card of sortedCards) {
    const review = reviews[getItemKey(card)];
    if (!review) {
      neverReviewed++;
      if (fresh.length < newQuota) fresh.push(card);
    } else if (getCardDueDate(review) <= now) {
      due.push(card);
    }
  }
  return {
    cards: [...due, ...fresh],
    dueCount: due.length,
    newCount: fresh.length,
    /** New cards not in this session, available for "+10 more new" */
    newLeft: neverReviewed - fresh.length
  };
};

/** "2026-10-31" in local time. */
export const toLocalDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
