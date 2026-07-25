/**
 * utils.ts — port of Rust src/utils.rs + filename helpers
 */

// Regex equivalents of Rust's RE_PARENS, RE_PREFIX, RE_THEMA
const RE_PARENS = /\s*\(.*?\)/g;
const RE_PREFIX = /^(jdn\.|etw\.)\s+/;
const RE_THEMA = /Thema(\d+)/;

/**
 * Port of Rust: clean_german_for_audio
 * Strips parenthetical notes, takes first comma/slash alternative,
 * and removes grammatical prefixes like "jdn." / "etw."
 */
export function cleanGermanForAudio(text: string): string {
  if (!text) return '';
  let t = text.replace(RE_PARENS, '');
  t = t.split(',')[0];
  t = t.split('/')[0];
  t = t.replace(RE_PREFIX, '');
  t = t.replace(/[*_]/g, '');
  return t.trim();
}

export function cleanExampleForAudio(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Port of Rust: colorize_gender
 * Wraps der/die/das article in a colored <span>.
 */
export function colorizeGender(german: string): string {
  if (german.startsWith('der ')) {
    return `<span style="color: #00d2ff; font-weight: bold;">der</span>${german.slice(3)}`;
  } else if (german.startsWith('die ')) {
    return `<span style="color: #ef4444; font-weight: bold;">die</span>${german.slice(3)}`;
  } else if (german.startsWith('das ')) {
    return `<span style="color: #22c55e; font-weight: bold;">das</span>${german.slice(3)}`;
  }
  return german;
}

/**
 * Port of Rust: highlight_word_in_example
 * Highlights the main word (or its declined form) in the example sentence.
 */
export function highlightWordInExample(cleanGerman: string, example: string, originalGerman?: string): string {
  if (!example) return '';

  const terms: string[] = [];

  // ── 1. Parse ALL conjugated forms from the ORIGINAL German (before parentheses were stripped).
  //       This is critical for B2_Verben.txt entries like:
  //       "schlafen (schläft, schlief, hat geschlafen)"  →  adds schläft, schlief, geschlafen
  if (originalGerman) {
    const parensMatch = originalGerman.match(/\((.*?)\)/);
    if (parensMatch && parensMatch[1]) {
      parensMatch[1].split(',').forEach(form => {
        // First split by '/' to separate alternate forms like "ist/hat gefahren" or "bäckt/backt"
        form.split('/').forEach(part => {
          let f = part.trim();
          // Remove auxiliary verbs "hat", "ist", "haben", "sind" at start
          f = f.replace(/^(hat|ist|haben|sind)\s+/i, '').trim();
          // Remove separable-verb pipe characters
          f = f.replace(/\|/g, '');
          if (f.length > 2 && !f.startsWith('+') && !/^(hat|ist|haben|sind)$/i.test(f)) {
            terms.push(f);
          }
        });
      });
    }
  }

  // ── 2. Add base terms from cleanGerman (parentheses already stripped, pipe removed)
  const rawWords = cleanGerman.replace(/\(.*?\)/g, '').split(/\s+/);
  const skipList = new Set(['der', 'die', 'das', 'ein', 'eine', 'mit', 'auf', 'aus', 'von',
                            'bei', 'sich', 'jdn', 'etw', 'jdm', 'jds']);

  rawWords.forEach(w => {
    // ── Handle pipe-separated separable verbs: "ein|stellen" → "einstellen" + "stellen"
    const pipeParts = w.split('|').map(p => p.replace(/\.$/, '').trim()).filter(p => p.length > 2);
    // The full joined form (e.g. "einstellen")
    const cleaned = w.replace(/\|/g, '').replace(/\.$/, '').trim();

    if (cleaned.length > 2 && !skipList.has(cleaned.toLowerCase())) {
      terms.push(cleaned);
      // For infinitives ending in '-en', also add the stem (without '-en')
      // so regex can match conjugated forms: glauben→glaubt, achten→achtet, kommen→kommt
      if (cleaned.endsWith('en') && cleaned.length > 4) {
        terms.push(cleaned.slice(0, -2));
      }
      // Hard-coded umlaut conjugation helpers for common patterns
      if (cleaned.endsWith('laden') && cleaned.length > 5) terms.push('lädt');
      if (cleaned.endsWith('tragen') && cleaned.length > 6) terms.push('trägt');
      if (cleaned.endsWith('gehen') && cleaned.length > 5) terms.push('geht', 'ging');
      if (cleaned.endsWith('sehen') && cleaned.length > 5) terms.push('sieht', 'sah');
      if (cleaned.endsWith('halten') && cleaned.length > 6) terms.push('hält', 'hielt');
    }

    // Add each pipe part separately: "stellen" from "ein|stellen"
    // This catches "einzustellen" via the "stell" stem match later
    if (pipeParts.length > 1) {
      pipeParts.forEach(part => {
        if (!skipList.has(part.toLowerCase())) {
          terms.push(part);
          if (part.endsWith('en') && part.length > 4) terms.push(part.slice(0, -2));
        }
      });
    }
  });

  // ── 3. For long compound terms (≥8 chars), add the last 6-char segment as a stem.
  //       e.g. "einstellen" → "tellen", "zusammenarbeiten" → "beiten"
  //       These act as fallback anchors for suffix-match in separable constructions.
  const termsSnapshot = [...terms];
  termsSnapshot.forEach(t => {
    if (t.length >= 8) terms.push(t.slice(-6));
  });

  // Sort longest first — prefer the most specific match
  const sortedTerms = [...new Set(terms)].sort((a, b) => b.length - a.length);

  const wb = `(^|[^\\p{L}\\p{N}])`;
  const we = `($|[^\\p{L}\\p{N}])`;

  let highlightedExample = example;
  let hasHighlighted = false;

  for (const term of sortedTerms) {
    if (term.length < 3) continue;
    try {
      // Match: term + any trailing letters (catches declined/conjugated suffixes)
      const pattern = new RegExp(`${wb}(${escapeRegex(term)}[\\p{L}]*)${we}`, 'iu');
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

  // ── 4. Fallback: 5-char prefix of the main word (was 4, increased for better precision)
  if (!hasHighlighted) {
    const mainWord = rawWords[rawWords.length - 1]?.replace(/\|/g, '').replace(/\.$/, '') ?? '';
    const prefix = mainWord.slice(0, 5);
    if (prefix.length >= 5) {
      try {
        const prefixPattern = new RegExp(`${wb}(${escapeRegex(prefix)}[\\p{L}]*)${we}`, 'iu');
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

  // ── 5. Fallback for separable-verb Partizip II: "gefangen" inside "abgefangen".
  //       Match ge-forms as a substring (no left word boundary required).
  if (!hasHighlighted) {
    const geTerms = sortedTerms.filter(t => /^ge/i.test(t) && t.length >= 5);
    for (const term of geTerms) {
      try {
        // No left-boundary: allow prefix characters (ab|aus|zu|zurück|etc.)
        const substringPattern = new RegExp(`([\\p{L}]*(${escapeRegex(term)}[\\p{L}]*))${we}`, 'iu');
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
  // ── 6. Fallback: general substring search for terms ≥5 chars inside compound words.
  //       Catches noun roots: "Berater" inside "Rentenberater"
  //       Catches separable verb suffixes: "stellen" inside "einzustellen"
  //       Catches noun inflections: "Einkommen" inside "Nettoeinkommen"
  if (!hasHighlighted) {
    const longTerms = sortedTerms.filter(t => t.length >= 5);
    for (const term of longTerms) {
      try {
        // Match a word that CONTAINS this term anywhere (not just at start)
        // The word must be longer than term (otherwise already caught by boundary match)
        const substringPattern = new RegExp(`(${wb.slice(1, -1)}[\\p{L}]*(${escapeRegex(term)})[\\p{L}]*)${we}`, 'iu');
        if (substringPattern.test(highlightedExample)) {
          highlightedExample = highlightedExample.replace(
            // Find the full word containing the term
            new RegExp(`${wb}([\\p{L}]*${escapeRegex(term)}[\\p{L}]*)${we}`, 'iu'),
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

  return highlightedExample;
}

/**
 * Port of Rust: get_num (builder.rs)
 * Extracts Thema number from filename.
 */
export function getThemaNum(filename: string): number {
  if (filename.includes('Redemittel')) return 95;
  if (filename.includes('Nomen_Verb')) return 96;
  if (filename.includes('Adjektive')) return 97;
  if (filename.includes('Praepositionen')) return 98;
  if (filename.includes('Verben')) return 99;
  const m = RE_THEMA.exec(filename);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * New helper: detects the level from the source filename.
 * "B1_plus_ThemaX.txt" → "B1+"
 * "B2_ThemaX.txt"      → "B2"
 */
export function getLevelFromFilename(filename: string): string {
  return filename.includes('B1_plus') ? 'B1+' : 'B2';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
