// Cleans saved progress and moves it from older key formats to the current one
// (see normalizeItemKey). Input is untrusted: localStorage or a backup file.
import type { SRSState } from '../types';
import { normalizeItemKey } from './words';

export interface MigratedProgress {
  masteredIds: string[];
  srsData: Record<string, SRSState>;
  /** True when anything was renamed or dropped, i.e. storage should be rewritten. */
  changed: boolean;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const toSrsState = (value: unknown): SRSState | null => {
  if (!isRecord(value)) return null;
  const { level, lastReview } = value;
  if (typeof level !== 'number' || typeof lastReview !== 'number') return null;
  if (!Number.isFinite(level) || !Number.isFinite(lastReview)) return null;
  return {
    level: Math.min(5, Math.max(0, Math.floor(level))),
    lastReview: Math.max(0, Math.floor(lastReview))
  };
};

export function migrateProgressKeys(masteredIds: unknown, srsData: unknown): MigratedProgress {
  // Anything unreadable becomes "no progress" instead of crashing the app on startup
  let changed = !Array.isArray(masteredIds) || !isRecord(srsData);
  const masteredList: unknown[] = Array.isArray(masteredIds) ? masteredIds : [];
  const srsRecord: Record<string, unknown> = isRecord(srsData) ? srsData : {};

  const mastered = new Set<string>();
  for (const key of masteredList) {
    if (typeof key !== 'string' || !key.trim()) {
      changed = true;
      continue;
    }
    const next = normalizeItemKey(key);
    if (next !== key || mastered.has(next)) changed = true;
    mastered.add(next);
  }

  const srs: Record<string, SRSState> = {};
  for (const [key, value] of Object.entries(srsRecord)) {
    const state = toSrsState(value);
    if (!state || FORBIDDEN_KEYS.has(key)) {
      changed = true;
      continue;
    }
    const raw = value as SRSState;
    if (state.level !== raw.level || state.lastReview !== raw.lastReview) changed = true; // clamped
    const next = normalizeItemKey(key);
    if (next !== key) changed = true;
    const existing = srs[next];
    // Same card saved under an old and a new key (e.g. an old tab wrote it back): keep the latest
    if (existing) {
      changed = true;
      if (existing.lastReview >= state.lastReview) continue;
    }
    srs[next] = state;
  }

  return { masteredIds: [...mastered], srsData: srs, changed };
}
