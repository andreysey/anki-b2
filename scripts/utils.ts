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

  const words = cleanGerman.split(/\s+/);
  const mainWord = words[words.length - 1]?.replace(/\|/g, '') ?? '';

  // Rust's String::len() checks BYTES, not characters.
  // "für" is 3 characters but 4 bytes (ü is 2 bytes in UTF-8), so it passed the check in Rust.
  // To achieve 100% identical output, we check byte length here.
  const byteLen = new TextEncoder().encode(mainWord).length;

  if (byteLen > 3) {
    // Safe unicode word boundary using capturing groups instead of lookbehinds
    // This avoids catastrophic backtracking in V8 while matching Rust's unicode \b
    const wb = `(^|[^\\p{L}\\p{N}])`;
    const we = `($|[^\\p{L}\\p{N}])`;

    try {
      // Try case-insensitive match with unicode word boundary
      const pattern = new RegExp(`${wb}(${escapeRegex(mainWord)}[\\p{L}]*)${we}`, 'iu');
      if (pattern.test(example)) {
        return example.replace(pattern, (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`);
      }

      // Fallback: 4-char prefix match for declined/conjugated forms
      const prefix = mainWord.slice(0, 4);
      if (prefix.length >= 4) {
        const prefixPattern = new RegExp(`${wb}(${escapeRegex(prefix)}[\\p{L}]*)${we}`, 'iu');
        return example.replace(prefixPattern, (_, p1, p2, p3) => `${p1}<b style="color: #eab308;">${p2}</b>${p3}`);
      }
    } catch {
      // RegEx fallback
    }
  }

  return example;
}

/**
 * Port of Rust: get_num (builder.rs)
 * Extracts Thema number from filename.
 */
export function getThemaNum(filename: string): number {
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
