import { describe, it, expect } from 'vitest';
import { reviewCard, getCardDueDate, compareStudyCards, SRS_INTERVALS_MS } from './srs';
import { createMockWord } from '../test-utils/fixtures';

const NOW = Date.UTC(2026, 9, 30, 12);
const DAY = 24 * 60 * 60 * 1000;

describe('reviewCard', () => {
  it.each([
    ['again', 3, 0],
    ['hard', 3, 3],
    ['good', 3, 4],
    ['easy', 3, 5],
    ['easy', 5, 5],
    ['good', undefined, 1]
  ] as const)('%s from level %s → %s', (rating, level, expected) => {
    const current = level === undefined ? undefined : { level, lastReview: NOW - DAY };
    expect(reviewCard(current, rating, NOW)).toEqual({ level: expected, lastReview: NOW });
  });
});

describe('getCardDueDate', () => {
  it('treats new, reset or corrupt cards as due now', () => {
    expect(getCardDueDate(undefined)).toBe(0);
    expect(getCardDueDate({ level: 0, lastReview: NOW })).toBe(0);
    expect(getCardDueDate({ level: Number.NaN, lastReview: NOW })).toBe(0);
  });

  it('adds the box interval and clamps out-of-range levels', () => {
    expect(getCardDueDate({ level: 2, lastReview: NOW })).toBe(NOW + SRS_INTERVALS_MS[2]!);
    expect(getCardDueDate({ level: 9, lastReview: NOW })).toBe(NOW + SRS_INTERVALS_MS[5]!);
  });
});

describe('compareStudyCards', () => {
  const a = createMockWord({ id: 'a' });
  const b = createMockWord({ id: 'b' });

  it('puts due cards before not-yet-due cards', () => {
    const srs = { a: { level: 3, lastReview: NOW }, b: { level: 1, lastReview: NOW - 2 * DAY } };
    expect(compareStudyCards(a, b, srs, NOW)).toBeGreaterThan(0); // b is due, a is not
  });

  it('among due cards, lower levels come first', () => {
    const srs = {
      a: { level: 2, lastReview: NOW - 10 * DAY },
      b: { level: 1, lastReview: NOW - 2 * DAY }
    };
    expect(compareStudyCards(a, b, srs, NOW)).toBeGreaterThan(0);
  });
});
