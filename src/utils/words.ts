// Word identity and search helpers (pure, no Vue).
import type { Word } from '../types';

/**
 * Plain text of an HTML snippet — for keys, clipboard, sharing and search.
 * Never insert the result as HTML; use sanitizeHtml / sanitizeAiHtml for v-html.
 */
export const stripTags = (html: string): string => html.replace(/<[^>]*>?/g, '');

const plainKeyText = (text: string): string => stripTags(text).replace(/\s+/g, ' ').trim();

/**
 * Key under which a card's progress is saved: its id, or the plain German text + thema
 * ("die Abteilung, -en-1"). Display markup (article colours) is not part of it, so restyling
 * the data never loses anyone's progress.
 */
export const getItemKey = (item: Word): string =>
  item.id || `${plainKeyText(item.german)}-${item.thema}`;

/**
 * Converts a saved key from any older format to the current one. Until v1.64 keys contained
 * the German column's HTML (`<span style="color: …">die</span> Abteilung, -en-1`).
 */
export const normalizeItemKey = (key: string): string => {
  const match = key.match(/^([\s\S]*)-(\d+)$/);
  return match ? `${plainKeyText(match[1] ?? '')}-${match[2]}` : plainKeyText(key);
};

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
