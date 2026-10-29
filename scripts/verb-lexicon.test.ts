import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildVerbLexicon,
  extractInfinitive,
  lookupVerbForms,
  parseVerbEntry,
  type VerbLexicon
} from './verb-lexicon.js';
import { highlightWordInExample } from './utils.js';

const SOURCE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'source');

const lexicon: VerbLexicon = new Map([
  ['treffen', ['trifft', 'traf', 'getroffen']],
  ['kommen', ['kommt', 'kam', 'gekommen']],
  ['bewerben', ['bewirbt', 'bewarb', 'beworben']],
  ['ausstatten', ['stattet', 'stattete', 'ausgestattet']]
]);

const HL = (word: string) => `<b style="color: #eab308;">${word}</b>`;

describe('extractInfinitive', () => {
  it('finds the verb among placeholders, prepositions and notes', () => {
    expect(extractInfinitive('jdn. hinweisen auf (+ Akk.)')).toBe('hinweisen');
    expect(extractInfinitive('sich treffen mit (+ Dat.)')).toBe('treffen');
    expect(extractInfinitive('etw. ein|geben')).toBe('eingeben');
    expect(extractInfinitive('handeln von')).toBe('handeln');
  });

  it('returns null for nouns and phrases without a verb', () => {
    expect(extractInfinitive('die Abteilung, -en')).toBeNull();
    expect(extractInfinitive('Am ... um ....')).toBeNull();
  });
});

describe('parseVerbEntry', () => {
  it('parses principal forms, dropping auxiliaries, "sich" and particles', () => {
    expect(parseVerbEntry('sich bewerben (bewirbt sich, bewarb sich, hat sich beworben)')).toEqual([
      'bewerben',
      ['bewirbt', 'bewarb', 'beworben']
    ]);
    expect(parseVerbEntry('etw. ausstatten (stattet aus, stattete aus, hat ausgestattet)')).toEqual(
      ['ausstatten', ['stattet', 'stattete', 'ausgestattet']]
    );
    expect(parseVerbEntry('kommen (kommt, kam, ist gekommen)')).toEqual([
      'kommen',
      ['kommt', 'kam', 'gekommen']
    ]);
  });

  it('ignores entries without forms', () => {
    expect(parseVerbEntry('handeln von (+ Dat.)')).toBeNull();
    expect(parseVerbEntry('die Abteilung, -en')).toBeNull();
  });
});

describe('lookupVerbForms', () => {
  it('returns forms of known verbs', () => {
    expect(lookupVerbForms('treffen', lexicon)).toEqual(['trifft', 'traf', 'getroffen']);
  });

  it('derives forms of separable verbs from their base verb', () => {
    const forms = lookupVerbForms('herauskommen', lexicon);
    expect(forms).toEqual(expect.arrayContaining(['herauskam', 'herausgekommen', 'kommt', 'kam']));
  });

  it('builds regular forms for unknown verbs', () => {
    expect(lookupVerbForms('wählen', lexicon)).toEqual(['wählt', 'wählte', 'gewählt']);
    expect(lookupVerbForms('arbeiten', lexicon)).toEqual(['arbeitet', 'arbeitete', 'gearbeitet']);
    expect(lookupVerbForms('reparieren', lexicon)).toEqual(['repariert', 'reparierte']);
    expect(lookupVerbForms('verkaufen', lexicon)).toContain('verkauft');
  });

  it('builds regular forms for unknown separable verbs', () => {
    expect(lookupVerbForms('übereinstimmen', lexicon)).toEqual(
      expect.arrayContaining(['stimmt', 'stimmte', 'übereingestimmt'])
    );
  });
});

describe('highlightWordInExample with verb forms', () => {
  it('highlights irregular forms the card itself does not list', () => {
    const forms = lookupVerbForms('treffen', lexicon);
    expect(
      highlightWordInExample(
        'sich treffen mit',
        'Die Kommission trifft sich morgen.',
        undefined,
        forms
      )
    ).toContain(HL('trifft'));
  });

  it('highlights participles with ge- and irregular stems', () => {
    expect(
      highlightWordInExample(
        'wählen zu',
        'Er wurde zum Vorsitzenden gewählt.',
        undefined,
        lookupVerbForms('wählen', lexicon)
      )
    ).toContain(HL('gewählt'));
    expect(
      highlightWordInExample(
        'sich bewerben um',
        'Sie hat sich um die Stelle beworben.',
        undefined,
        lookupVerbForms('bewerben', lexicon)
      )
    ).toContain(HL('beworben'));
  });

  it('does not match short forms inside unrelated words', () => {
    const forms = lookupVerbForms('kommen', lexicon);
    const result = highlightWordInExample('kommen zu', 'Die Kamera ist neu.', undefined, forms);
    expect(result).not.toContain('<b');
  });
});

describe('buildVerbLexicon (real sources)', () => {
  it('collects verb forms from the source files', () => {
    const real = buildVerbLexicon(SOURCE_DIR);
    expect(real.size).toBeGreaterThan(300);
    expect(real.get('treffen')).toEqual(['trifft', 'traf', 'getroffen']);
    expect(real.get('hinweisen')).toEqual(['weist', 'wies', 'hingewiesen']);
  });
});
