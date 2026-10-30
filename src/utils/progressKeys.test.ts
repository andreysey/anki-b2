import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateProgressKeys } from './progressKeys';
import { getItemKey, normalizeItemKey } from './words';
import type { Word } from '../types';
import dataJson from '../../public/data.json';

const RED_DIE = '<span style="color: #ef4444; font-weight: bold;">die</span>';
const LEGACY = `${RED_DIE} Abteilung, -en-1`;
const CURRENT = 'die Abteilung, -en-1';

describe('card keys', () => {
  it('do not contain display markup', () => {
    const word = { german: `${RED_DIE} Abteilung, -en`, thema: 1 } as Word;
    expect(getItemKey(word)).toBe(CURRENT);
  });

  it('stay the same when article colours change', () => {
    const recoloured = {
      german: '<span style="color: #b91c1c">die</span> Abteilung, -en',
      thema: 1
    };
    expect(getItemKey(recoloured as Word)).toBe(CURRENT);
  });

  it('old keys convert to the current key; current keys stay as they are', () => {
    expect(normalizeItemKey(LEGACY)).toBe(CURRENT);
    expect(normalizeItemKey(CURRENT)).toBe(CURRENT);
    // Hyphens and numbers inside the word must not be mistaken for the thema
    expect(normalizeItemKey('<b>der</b> 3-D-Drucker, --12')).toBe('der 3-D-Drucker, --12');
  });

  it('every card in data.json converts from its old key to exactly its current key', () => {
    const words = dataJson as Word[];
    expect(words.length).toBeGreaterThan(3000);
    const current = new Set<string>();
    for (const word of words) {
      const key = getItemKey(word);
      expect(normalizeItemKey(`${word.german}-${word.thema}`)).toBe(key);
      current.add(key);
    }
    expect(current.size).toBe(words.length); // keys are unique
  });
});

describe('migrateProgressKeys', () => {
  it('renames old keys and reports the change', () => {
    const result = migrateProgressKeys([LEGACY], { [LEGACY]: { level: 2, lastReview: 100 } });
    expect(result).toEqual({
      masteredIds: [CURRENT],
      srsData: { [CURRENT]: { level: 2, lastReview: 100 } },
      changed: true
    });
  });

  it('leaves current data untouched', () => {
    const result = migrateProgressKeys([CURRENT], { [CURRENT]: { level: 1, lastReview: 5 } });
    expect(result.changed).toBe(false);
    expect(result.srsData).toEqual({ [CURRENT]: { level: 1, lastReview: 5 } });
  });

  it('keeps the most recent review when a card exists under both keys', () => {
    const newer = { level: 3, lastReview: 200 };
    const older = { level: 1, lastReview: 100 };
    expect(migrateProgressKeys([], { [LEGACY]: older, [CURRENT]: newer }).srsData).toEqual({
      [CURRENT]: newer
    });
    expect(migrateProgressKeys([], { [CURRENT]: older, [LEGACY]: newer }).srsData).toEqual({
      [CURRENT]: newer
    });
  });

  it('merges a word marked as mastered under both keys', () => {
    const result = migrateProgressKeys([LEGACY, CURRENT], {});
    expect(result).toMatchObject({ masteredIds: [CURRENT], changed: true });
  });
});

describe('saved progress from an older version', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('is moved to the current keys when the app starts', async () => {
    localStorage.setItem('anki_srs_v2', JSON.stringify({ [LEGACY]: { level: 4, lastReview: 1 } }));
    localStorage.setItem('anki_mastered_words', JSON.stringify([LEGACY]));

    const { useProgress } = await import('../composables/useProgress');
    const { srsData, masteredIds } = useProgress();

    expect(srsData.value).toEqual({ [CURRENT]: { level: 4, lastReview: 1 } });
    expect([...masteredIds.value]).toEqual([CURRENT]);
    expect(JSON.parse(localStorage.getItem('anki_srs_v2')!)).toEqual(srsData.value);
    expect(JSON.parse(localStorage.getItem('anki_mastered_words')!)).toEqual([CURRENT]);
  });

  it('is migrated when restored from an old backup', async () => {
    const { useProgress } = await import('../composables/useProgress');
    const { restoreProgress, srsData, masteredIds } = useProgress();

    restoreProgress([LEGACY], { [LEGACY]: { level: 2, lastReview: 9 } });

    expect(srsData.value).toEqual({ [CURRENT]: { level: 2, lastReview: 9 } });
    expect([...masteredIds.value]).toEqual([CURRENT]);
  });
});
