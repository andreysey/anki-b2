/**
 * verb-lexicon.ts — collects verb forms written in the sources, e.g.
 *   "treffen (trifft, traf, hat getroffen)"
 * so cards that list a verb *without* forms (B2_Verben_Praepositionen.txt)
 * can still highlight irregular forms like "trifft" or "beworben" in examples.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SEP_PREFIXES } from './verb-grammar.ts';

export type VerbLexicon = Map<string, string[]>;

// Separable prefixes, longest first so "heraus" wins over "her".
const PREFIXES = [
  ...new Set([
    ...SEP_PREFIXES,
    'heraus',
    'herein',
    'hervor',
    'voran',
    'herunter',
    'hinaus',
    'hinein',
    'überein',
    'zurecht'
  ])
].sort((a, b) => b.length - a.length);

const INSEPARABLE = /^(be|emp|ent|er|ge|miss|ver|zer)/;
const FORMS_RE = /\(([^()]+,\s*[^()]+,\s*(?:hat|ist|hat\/ist)\s+[^()]+)\)\s*$/;
const VERB_WORD_RE = /^[a-zäöüß]{2,}(en|ln|rn)$/;
// Words that end like infinitives but aren't verbs
const NOT_VERBS = new Set([
  'gegen',
  'wegen',
  'zwischen',
  'neben',
  'binnen',
  'oben',
  'unten',
  'innen',
  'außen',
  'einen',
  'keinen',
  'jemanden',
  'seinen',
  'ihren'
]);
// Everything on a card that isn't the verb itself: "sich einsetzen für" → only "einsetzen" counts
const FUNCTION_WORDS = new Set([
  'sich',
  'jdn',
  'jdm',
  'jds',
  'etw',
  'jemanden',
  'jemandem',
  'an',
  'auf',
  'aus',
  'bei',
  'durch',
  'für',
  'gegen',
  'in',
  'mit',
  'nach',
  'über',
  'um',
  'unter',
  'von',
  'vor',
  'zu',
  'zum',
  'zur',
  'zwischen',
  'wegen',
  'hinter',
  'neben',
  'als'
]);
const PARTICLES = new Set(PREFIXES);
const AUX_OR_PRONOUN = new Set(['hat', 'ist', 'sich', 'haben', 'sein']);

const lexiconCache = new Map<string, VerbLexicon>();

/** Splits "hat sich beworben" / "stattet aus" / "wusste/wußte" into single verb words. */
function formWords(form: string): string[] {
  return form
    .trim()
    .replace(/^(hat\/ist|hat|ist)\s+/i, '')
    .split(/[\s/]+/)
    .map((w) => w.replace(/\|/g, '').trim())
    .filter((w) => w.length >= 3 && !AUX_OR_PRONOUN.has(w) && !PARTICLES.has(w));
}

/** Returns the infinitive from a card's German column, e.g. "jdn. hinweisen auf (+ Akk.)" → "hinweisen". */
export function extractInfinitive(german: string): string | null {
  const words = german
    .replace(/\(.*?\)/g, ' ')
    .replace(/\|/g, '')
    .split(/\s+/)
    .filter((w) => VERB_WORD_RE.test(w) && !NOT_VERBS.has(w));
  return words.length ? words[words.length - 1] : null;
}

/** True when the verb is the only content word: "sich einsetzen für" yes, "treu bleiben" no. */
export function isSingleVerbCard(german: string): boolean {
  const content = german
    .replace(/\(.*?\)/g, ' ')
    .replace(/[|.]/g, '')
    .split(/[\s/]+/)
    .filter((w) => w && !FUNCTION_WORDS.has(w.toLowerCase()));
  return content.length === 1 && extractInfinitive(content[0]) === content[0];
}

export function parseVerbEntry(german: string): [string, string[]] | null {
  const m = german.match(FORMS_RE);
  if (!m) return null;
  const infinitive = extractInfinitive(german.slice(0, m.index));
  if (!infinitive) return null;
  // Drop other words of multi-word entries: "treu bleiben (bleibt treu, …)" → bleibt, not treu
  const lemmaWords = new Set(
    german
      .slice(0, m.index)
      .replace(/\|/g, '')
      .split(/\s+/)
      .filter((w) => w !== infinitive)
  );
  const forms = m[1]
    .split(',')
    .flatMap(formWords)
    .filter((w) => !lemmaWords.has(w));
  return forms.length ? [infinitive, [...new Set(forms)]] : null;
}

export function buildVerbLexicon(sourceDir: string): VerbLexicon {
  const cached = lexiconCache.get(sourceDir);
  if (cached) return cached;

  const lexicon: VerbLexicon = new Map();
  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith('.txt'))
    .sort();
  for (const f of files) {
    for (const line of fs.readFileSync(path.join(sourceDir, f), 'utf8').split('\n')) {
      const entry = parseVerbEntry(line.split(';')[0].trim());
      if (entry && !lexicon.has(entry[0])) lexicon.set(entry[0], entry[1]);
    }
  }
  lexiconCache.set(sourceDir, lexicon);
  return lexicon;
}

/** Regular (weak) verb forms: wählen → wählt, wählte, gewählt; arbeiten → arbeitet, arbeitete, gearbeitet. */
function regularForms(verb: string): string[] {
  if (!verb.endsWith('en')) return [];
  const stem = verb.slice(0, -2);
  const e = /[td]$/.test(stem) ? 'e' : '';
  const noGe = verb.endsWith('ieren') || INSEPARABLE.test(verb);
  return [stem + e + 't', stem + e + 'te', (noGe ? '' : 'ge') + stem + e + 't'];
}

/**
 * Extra forms to look for when highlighting `verb` (an infinitive).
 * Separable verbs also get the bare verb forms ("kommt" for "ankommen"),
 * because in main clauses the prefix moves to the end of the sentence.
 */
/** Separable prefix of an infinitive, if any: "zustehen" → "zu", "übereinstimmen" → "überein". */
export function separablePrefix(verb: string): string | null {
  return PREFIXES.find((p) => verb.startsWith(p) && verb.length - p.length >= 4) ?? null;
}

export function lookupVerbForms(verb: string, lexicon: VerbLexicon): string[] {
  const direct = lexicon.get(verb);
  const prefix = separablePrefix(verb);
  const base = prefix ? verb.slice(prefix.length) : null;
  const baseForms = base ? lexicon.get(base) : undefined;

  const forms: string[] = [];
  if (direct) forms.push(...direct);
  if (prefix && base) {
    if (baseForms) {
      // Joined forms in subordinate clauses + participle: herauskam, herausgekommen
      forms.push(...baseForms.map((f) => prefix + f));
      forms.push(...baseForms.filter((f) => !/^ge/.test(f)));
    }
    forms.push(base);
    if (!direct && !baseForms) {
      // stimmen → stimmt, stimmte (split off) + übereingestimmt (joined participle)
      const [present, past, participle] = regularForms(base);
      if (participle) forms.push(present, past, prefix + participle);
    }
  } else if (!direct) {
    forms.push(...regularForms(verb));
  }
  return [...new Set(forms)].filter((f) => f.length >= 3 && f !== verb);
}
