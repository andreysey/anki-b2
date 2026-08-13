/**
 * utils.ts — port of Rust src/utils.rs + filename helpers
 */

import { THEMA_NUMBERS } from '../src/constants/themas.js';

// Regex equivalents of Rust's RE_PARENS, RE_PREFIX, RE_THEMA
const RE_PARENS = /\s*\(.*?\)/g;
const RE_PREFIX = /^(jdn\.|etw\.)\s+/;
const RE_THEMA = /Thema(\d+)/;

// Module-level caches for fast repeated lookups across deck builds
const cleanGermanCache = new Map<string, string>();
const cleanExampleCache = new Map<string, string>();
const colorizeGenderCache = new Map<string, string>();
const highlightWordCache = new Map<string, string>();
const regexPatternCache = new Map<string, RegExp>();

const getCompiledRegex = (patternStr: string, flags: string): RegExp => {
  const key = `${patternStr}|||${flags}`;
  let regex = regexPatternCache.get(key);
  if (!regex) {
    regex = new RegExp(patternStr, flags);
    regexPatternCache.set(key, regex);
  }
  return regex;
};

/**
 * Port of Rust: clean_german_for_audio
 * Strips parenthetical notes, takes first comma/slash alternative,
 * and removes grammatical prefixes like "jdn." / "etw."
 */
export function cleanGermanForAudio(text: string): string {
  if (!text) return '';
  const cached = cleanGermanCache.get(text);
  if (cached !== undefined) return cached;

  let t = text.replace(RE_PARENS, '');
  t = t.split(',')[0];
  t = t.split('/')[0];
  t = t.replace(RE_PREFIX, '');
  t = t.replace(/[*_]/g, '');
  const result = t.trim();
  cleanGermanCache.set(text, result);
  return result;
}

export function cleanExampleForAudio(text: string): string {
  if (!text) return '';
  const cached = cleanExampleCache.get(text);
  if (cached !== undefined) return cached;

  const result = text
    .replace(/<[^>]*>/g, '')
    .replace(/[*_]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/…/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  cleanExampleCache.set(text, result);
  return result;
}

/**
 * Port of Rust: colorize_gender
 * Wraps der/die/das article in a colored <span>.
 */
export function colorizeGender(german: string): string {
  if (!german) return '';
  const cached = colorizeGenderCache.get(german);
  if (cached !== undefined) return cached;

  let result = german;
  if (german.startsWith('der ')) {
    result = `<span style="color: #00d2ff; font-weight: bold;">der</span>${german.slice(3)}`;
  } else if (german.startsWith('die ')) {
    result = `<span style="color: #ef4444; font-weight: bold;">die</span>${german.slice(3)}`;
  } else if (german.startsWith('das ')) {
    result = `<span style="color: #22c55e; font-weight: bold;">das</span>${german.slice(3)}`;
  }
  colorizeGenderCache.set(german, result);
  return result;
}

/**
 * Port of Rust: highlight_word_in_example
 * Highlights the main word (or its declined form) in the example sentence.
 */
export function highlightWordInExample(cleanGerman: string, example: string, originalGerman?: string): string {
  if (!example) return '';
  const cacheKey = `${cleanGerman}|||${example}|||${originalGerman ?? ''}`;
  const cached = highlightWordCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const terms: string[] = [];

  // ── 1. Parse ALL conjugated forms from the ORIGINAL German (before parentheses were stripped).
  if (originalGerman) {
    const parensMatch = originalGerman.match(/\((.*?)\)/);
    if (parensMatch && parensMatch[1]) {
      parensMatch[1].split(',').forEach(form => {
        form.split('/').forEach(part => {
          let f = part.trim();
          f = f.replace(/^(hat|ist|haben|sind)\s+/i, '').trim();
          f = f.replace(/\|/g, '');
          if (f.length > 2 && !f.startsWith('+') && !/^(hat|ist|haben|sind)$/i.test(f)) {
            terms.push(f);
          }
        });
      });
    }
  }

  // ── 2. Add base terms from cleanGerman
  const rawWords = cleanGerman.replace(/\(.*?\)/g, '').split(/\s+/);
  const skipList = new Set(['der', 'die', 'das', 'ein', 'eine', 'mit', 'auf', 'aus', 'von',
                            'bei', 'sich', 'jdn', 'etw', 'jdm', 'jds']);

  rawWords.forEach(w => {
    const pipeParts = w.split('|').map(p => p.replace(/\.$/, '').trim()).filter(p => p.length > 2);
    const cleaned = w.replace(/\|/g, '').replace(/\.$/, '').trim();

    if (cleaned.length > 2 && !skipList.has(cleaned.toLowerCase())) {
      terms.push(cleaned);
      if (cleaned.endsWith('en') && cleaned.length > 4) {
        terms.push(cleaned.slice(0, -2));
      }
      if (cleaned.endsWith('laden') && cleaned.length > 5) terms.push('lädt');
      if (cleaned.endsWith('tragen') && cleaned.length > 6) terms.push('trägt');
      if (cleaned.endsWith('gehen') && cleaned.length > 5) terms.push('geht', 'ging');
      if (cleaned.endsWith('sehen') && cleaned.length > 5) terms.push('sieht', 'sah');
      if (cleaned.endsWith('halten') && cleaned.length > 6) terms.push('hält', 'hielt');
    }

    if (pipeParts.length > 1) {
      pipeParts.forEach(part => {
        if (!skipList.has(part.toLowerCase())) {
          terms.push(part);
          if (part.endsWith('en') && part.length > 4) terms.push(part.slice(0, -2));
        }
      });
    }
  });

  // ── 3. Compound terms
  const termsSnapshot = [...terms];
  termsSnapshot.forEach(t => {
    if (t.length >= 8) terms.push(t.slice(-6));
  });

  const sortedTerms = [...new Set(terms)].sort((a, b) => b.length - a.length);

  const wb = `(^|[^\\p{L}\\p{N}])`;
  const we = `($|[^\\p{L}\\p{N}])`;

  let highlightedExample = example;
  let hasHighlighted = false;

  for (const term of sortedTerms) {
    if (term.length < 3) continue;
    try {
      const pattern = getCompiledRegex(`${wb}(${escapeRegex(term)}[\\p{L}]*)${we}`, 'iu');
      if (pattern.test(highlightedExample)) {
        highlightedExample = highlightedExample.replace(
          pattern,
          (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`,
        );
        hasHighlighted = true;
        break;
      }
    } catch {
      // skip invalid regex
    }
  }

  // ── 4. Fallback: 5-char prefix of the main word
  if (!hasHighlighted) {
    const mainWord = rawWords[rawWords.length - 1]?.replace(/\|/g, '').replace(/\.$/, '') ?? '';
    const prefix = mainWord.slice(0, 5);
    if (prefix.length >= 5) {
      try {
        const prefixPattern = getCompiledRegex(`${wb}(${escapeRegex(prefix)}[\\p{L}]*)${we}`, 'iu');
        if (prefixPattern.test(highlightedExample)) {
          highlightedExample = highlightedExample.replace(
            prefixPattern,
            (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`,
          );
          hasHighlighted = true;
        }
      } catch {
        // skip invalid regex
      }
    }
  }

  // ── 5. Fallback for separable-verb Partizip II
  if (!hasHighlighted) {
    const geTerms = sortedTerms.filter(t => /^ge/i.test(t) && t.length >= 5);
    for (const term of geTerms) {
      try {
        const substringPattern = getCompiledRegex(`([\\p{L}]*(${escapeRegex(term)}[\\p{L}]*))${we}`, 'iu');
        if (substringPattern.test(highlightedExample)) {
          highlightedExample = highlightedExample.replace(
            substringPattern,
            (_, fullWord, _inner, p3) => `<b style="color: #eab308;">${fullWord}</b>${p3}`,
          );
          hasHighlighted = true;
          break;
        }
      } catch {
        // skip invalid regex
      }
    }
  }

  // ── 6. Fallback: general substring search for terms ≥5 chars inside compound words
  if (!hasHighlighted) {
    const longTerms = sortedTerms.filter(t => t.length >= 5);
    for (const term of longTerms) {
      try {
        const substringPattern = getCompiledRegex(`(${wb.slice(1, -1)}[\\p{L}]*(${escapeRegex(term)})[\\p{L}]*)${we}`, 'iu');
        if (substringPattern.test(highlightedExample)) {
          const replacePattern = getCompiledRegex(`${wb}([\\p{L}]*${escapeRegex(term)}[\\p{L}]*)${we}`, 'iu');
          highlightedExample = highlightedExample.replace(
            replacePattern,
            (_, p1, fullWord, p3) => `${p1}<b style="color: #eab308;">${fullWord}</b>${p3}`,
          );
          hasHighlighted = true;
          break;
        }
      } catch {
        // skip invalid regex
      }
    }
  }

  highlightWordCache.set(cacheKey, highlightedExample);
  return highlightedExample;
}

/**
 * Port of Rust: get_num (builder.rs)
 * Extracts Thema number from filename using THEMA_NUMBERS constants.
 */
export function getThemaNum(filename: string): number {
  if (filename.includes('Redemittel')) return THEMA_NUMBERS.REDEMITTEL;
  if (filename.includes('Nomen_Verb')) return THEMA_NUMBERS.NOMEN_VERB;
  if (filename.includes('Adjektive')) return THEMA_NUMBERS.ADJEKTIVE;
  if (filename.includes('Praepositionen')) return THEMA_NUMBERS.PRAEPOSITIONEN;
  if (filename.includes('Verben')) return THEMA_NUMBERS.VERBEN;
  const m = RE_THEMA.exec(filename);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Helper: detects the level from the source filename.
 * "B1_plus_ThemaX.txt" → "B1+"
 * "B2_ThemaX.txt"      → "B2"
 */
export function getLevelFromFilename(filename: string): string {
  return filename.includes('B1_plus') ? 'B1+' : 'B2';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
