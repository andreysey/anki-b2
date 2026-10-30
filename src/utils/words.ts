// Word identity and search helpers (pure, no Vue).
import type { Word } from '../types';

/** Stable key for a card: its id, or german + thema for data without ids. */
export const getItemKey = (item: Word): string => item.id || `${item.german}-${item.thema}`;

/** Lowercase, ä→ae ö→oe ü→ue ß→ss, strip accents — "Prüfung" matches "pruefung". */
export const normalizeGermanText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Lowercase and strip accents — "Prüfung" matches "prufung". */
export const normalizeToSimpleAscii = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');

/** Precomputed lowercase text in all three spellings, searched with `includes`. */
export const buildSearchIndex = (word: Word): string => {
  const raw = `${word.german} ${word.english} ${word.ukrainian}`.toLowerCase();
  return `${raw} ${normalizeGermanText(raw)} ${normalizeToSimpleAscii(raw)}`;
};

export const matchesSearchFilter = (
  item: Word,
  rawQuery: string,
  normalizedQuery: string
): boolean => {
  if (!rawQuery) return true;
  const index = item._searchIndex ?? buildSearchIndex(item);
  return index.includes(rawQuery) || index.includes(normalizedQuery);
};
