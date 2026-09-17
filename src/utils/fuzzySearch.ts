// High-performance Levenshtein & Umlaut-aware Fuzzy Matcher for German vocabulary
import { normalizeGermanText, normalizeToSimpleAscii } from '../composables/useVocabulary';
import type { Word } from '../types';

export function getLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP optimization
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);

    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    // Swap row references
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

export function matchesFuzzy(
  text: string,
  query: string,
  maxDistance = 1
): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const target = text.toLowerCase();

  // 1. Direct substring match (fast path)
  if (target.includes(q)) return true;

  // 2. Normalized umlaut & ascii match
  const normTarget = normalizeGermanText(target);
  const normQuery = normalizeGermanText(q);
  if (normTarget.includes(normQuery)) return true;

  const asciiTarget = normalizeToSimpleAscii(target);
  const asciiQuery = normalizeToSimpleAscii(q);
  if (asciiTarget.includes(asciiQuery)) return true;

  // 3. For words of length >= 4, check token-based fuzzy edit distance
  if (q.length >= 4) {
    const tokens = target.split(/[\s,./<>()-]+/).filter((t) => t.length >= 3);
    for (const token of tokens) {
      if (Math.abs(token.length - q.length) <= maxDistance) {
        if (getLevenshteinDistance(token, q) <= maxDistance) {
          return true;
        }
        if (getLevenshteinDistance(normalizeGermanText(token), normQuery) <= maxDistance) {
          return true;
        }
      }
    }
  }

  return false;
}

export function filterWordsFuzzy(vocabulary: Word[], query: string, limit = 15): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return vocabulary.slice(0, limit);

  const exactMatches: Word[] = [];
  const fuzzyMatches: Word[] = [];

  for (let i = 0; i < vocabulary.length; i++) {
    const w = vocabulary[i];
    const rawGerman = w.german.replace(/<[^>]*>?/gm, '');
    const combined = `${rawGerman} ${w.english} ${w.ukrainian || ''}`;

    if (combined.toLowerCase().includes(q)) {
      exactMatches.push(w);
      if (exactMatches.length >= limit) break;
    } else if (matchesFuzzy(combined, q)) {
      fuzzyMatches.push(w);
    }
  }

  return [...exactMatches, ...fuzzyMatches].slice(0, limit);
}
