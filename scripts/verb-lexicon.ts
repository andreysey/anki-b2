/**
 * verb-lexicon.ts — collects verb forms written in the sources, e.g.
 *   "treffen (trifft, traf, hat getroffen)"
 * so cards that list a verb *without* forms (B2_Verben_Praepositionen.txt)
 * can still highlight irregular forms like "trifft" or "beworben" in examples.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SEP_PREFIXES } from './verb-grammar.js';

export type VerbLexicon = Map<string, string[]>;

// Separable prefixes, longest first so "heraus" wins over "her".
const PREFIXES = [
  ...new Set([
    ...SEP_PREFIXES,
    'heraus',
    'herein',
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
const PARTICLES = new Set(SEP_PREFIXES);
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
    .filter((w) => VERB_WORD_RE.test(w));
  return words.length ? words[words.length - 1] : null;
}

export function parseVerbEntry(german: string): [string, string[]] | null {
  const m = german.match(FORMS_RE);
  if (!m) return null;
  const infinitive = extractInfinitive(german.slice(0, m.index));
  if (!infinitive) return null;
  const forms = m[1].split(',').flatMap(formWords);
  return forms.length ? [infinitive, forms] : null;
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
export function lookupVerbForms(verb: string, lexicon: VerbLexicon): string[] {
  const direct = lexicon.get(verb);
  const prefix = PREFIXES.find((p) => verb.startsWith(p) && verb.length - p.length >= 4);
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
