// Moves saved progress from older key formats to the current one (see normalizeItemKey).
import type { SRSState } from '../types';
import { normalizeItemKey } from './words';

export interface MigratedProgress {
  masteredIds: string[];
  srsData: Record<string, SRSState>;
  /** True when any key was renamed, i.e. storage should be rewritten. */
  changed: boolean;
}

export function migrateProgressKeys(
  masteredIds: string[],
  srsData: Record<string, SRSState>
): MigratedProgress {
  let changed = false;

  const mastered = new Set<string>();
  for (const key of masteredIds) {
    const next = normalizeItemKey(key);
    if (next !== key || mastered.has(next)) changed = true;
    mastered.add(next);
  }

  const srs: Record<string, SRSState> = {};
  for (const [key, state] of Object.entries(srsData)) {
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
