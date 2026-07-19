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
  return t.trim();
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
export function highlightWordInExample(cleanGerman: string, example: string): string {
  if (!example) return '';

  // Extract candidate search terms
  const terms: string[] = [];

  // Parse words like "schließen (schließt, schloss, hat geschlossen)"
  // Extract all forms listed in parentheses or main words
  const parensMatch = cleanGerman.match(/\((.*?)\)/);
  if (parensMatch && parensMatch[1]) {
    parensMatch[1].split(',').forEach(form => {
      let f = form.replace(/^(hat|ist)\s+/, '').trim(); // Remove auxiliary verbs
      if (f.length > 2) terms.push(f);
    });
  }

  // Add the base terms
  const rawWords = cleanGerman.replace(/\(.*?\)/g, '').split(/\s+/);
  rawWords.forEach(w => {
    const cleaned = w.replace(/\|/g, '').trim();
    // Exclude articles, short prepositions etc.
    if (cleaned.length > 2 && !['der', 'die', 'das', 'ein', 'eine', 'mit', 'auf', 'aus', 'von', 'bei'].includes(cleaned.toLowerCase())) {
      terms.push(cleaned);
      // If it's a separable verb like "einladen", also check just the root "laden" or conjugated prefix forms
      if (cleaned.endsWith('laden') && cleaned.length > 5) terms.push('lädt');
      if (cleaned.endsWith('tragen') && cleaned.length > 6) terms.push('trägt');
      if (cleaned.endsWith('gehen') && cleaned.length > 5) terms.push('geht', 'ging');
      if (cleaned.endsWith('sehen') && cleaned.length > 5) terms.push('sieht', 'sah');
      if (cleaned.endsWith('halten') && cleaned.length > 6) {
        terms.push('hält', 'hielt');
      }
    }
  });

  // Sort terms by length descending so we match longer/more specific phrases first
  const sortedTerms = [...new Set(terms)].sort((a, b) => b.length - a.length);

  const wb = `(^|[^\\p{L}\\p{N}])`;
  const we = `($|[^\\p{L}\\p{N}])`;

  let highlightedExample = example;
  let hasHighlighted = false;

  for (const term of sortedTerms) {
    try {
      const pattern = new RegExp(`${wb}(${escapeRegex(term)}[\\p{L}]*)${we}`, 'iu');
      if (pattern.test(highlightedExample)) {
        highlightedExample = highlightedExample.replace(pattern, (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`);
        hasHighlighted = true;
        break; // Match the longest/best term and stop
      }
    } catch {
      // RegEx fallback
    }
  }

  // Fallback to prefix matching if nothing matched yet
  if (!hasHighlighted) {
    const mainWord = rawWords[rawWords.length - 1]?.replace(/\|/g, '') ?? '';
    const prefix = mainWord.slice(0, 4);
    if (prefix.length >= 4) {
      try {
        const prefixPattern = new RegExp(`${wb}(${escapeRegex(prefix)}[\\p{L}]*)${we}`, 'iu');
        if (prefixPattern.test(highlightedExample)) {
          highlightedExample = highlightedExample.replace(prefixPattern, (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`);
        }
      } catch {
        // RegEx fallback
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
