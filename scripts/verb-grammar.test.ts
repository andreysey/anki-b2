import { describe, it, expect } from 'vitest';
import { buildVerbTenses, formatTensesHtml } from './verb-grammar.js';

describe('verb-grammar', () => {
  it('returns null for non-verbs (nouns, phrases without 3 forms)', () => {
    expect(buildVerbTenses('das Auto, -s')).toBeNull();
    expect(buildVerbTenses('in der Regel')).toBeNull();
    expect(formatTensesHtml(null)).toBe('');
  });

  it('builds all 10 B2 tenses for regular/separable transitive verb (anfordern)', () => {
    const tenses = buildVerbTenses(
      'etw. anfordern (fordert an, forderte an, hat angefordert)',
      'Wir möchten ein Angebot anfordern.'
    );

    expect(tenses).not.toBeNull();
    expect(tenses?.length).toBe(10);

    const names = tenses?.map((t) => t.name);
    expect(names).toEqual([
      'Präsens',
      'Präteritum',
      'Perfekt',
      'Plusquamperfekt',
      'Futur I',
      'Futur II (Vermutung)',
      'Passiv',
      'Passiversatz',
      'Konjunktiv I',
      'Konjunktiv II'
    ]);

    const findTense = (name: string) => tenses?.find((t) => t.name === name)?.sentence;

    expect(findTense('Präsens')).toBe('Er fordert das Angebot an.');
    expect(findTense('Präteritum')).toBe('Gestern forderte er das Angebot an.');
    expect(findTense('Perfekt')).toBe('Er hat das Angebot angefordert.');
    expect(findTense('Plusquamperfekt')).toBe('Er hatte das Angebot angefordert.');
    expect(findTense('Futur I')).toBe('Er wird das Angebot anfordern.');
    expect(findTense('Futur II (Vermutung)')).toBe('Er wird wohl schon das Angebot angefordert haben.');
    expect(findTense('Passiv')).toBe('Das Angebot wird / wurde angefordert.');
    expect(findTense('Passiversatz')).toBe('Das Angebot lässt sich anfordern · ist anzufordern.');
    expect(findTense('Konjunktiv I')).toBe('Er sagte, er fordere das Angebot an.');
    expect(findTense('Konjunktiv II')).toBe('Er würde das Angebot anfordern · hätte das Angebot angefordert.');
  });

  it('handles reflexive verbs with prepositions (sich bewerben um)', () => {
    const tenses = buildVerbTenses(
      'sich bewerben um (+ Akk.) (bewirbt sich, bewarb sich, hat sich beworben)',
      'Er hat sich um die Stelle beworben.'
    );

    expect(tenses).not.toBeNull();
    const findTense = (name: string) => tenses?.find((t) => t.name === name)?.sentence;

    expect(findTense('Präsens')).toBe('Er bewirbt sich um die Stelle.');
    expect(findTense('Perfekt')).toBe('Er hat sich um die Stelle beworben.');
    expect(findTense('Passiv')).toContain('Nicht passivfähig');
    expect(findTense('Passiversatz')).toContain('Kein Passiversatz');
    expect(findTense('Konjunktiv II')).toBe('Er würde sich um die Stelle bewerben · hätte sich beworben.');
  });

  it('handles intransitive verbs with auxiliary sein (aufwachsen)', () => {
    const tenses = buildVerbTenses(
      'auf|wachsen (wächst auf, wuchs auf, ist aufgewachsen)',
      'Er ist zweisprachig aufgewachsen.'
    );

    expect(tenses).not.toBeNull();
    const findTense = (name: string) => tenses?.find((t) => t.name === name)?.sentence;

    expect(findTense('Perfekt')).toBe('Er ist rechtzeitig aufgewachsen.');
    expect(findTense('Plusquamperfekt')).toBe('Er war rechtzeitig aufgewachsen.');
    expect(findTense('Futur II (Vermutung)')).toBe('Er wird wohl schon rechtzeitig aufgewachsen sein.');
    expect(findTense('Passiv')).toContain('Nicht passivfähig');
    expect(findTense('Passiversatz')).toContain('Kein Passiversatz');
  });

  it('formats collapsible details HTML for Anki correctly', () => {
    const tenses = buildVerbTenses(
      'etw. anfordern (fordert an, forderte an, hat angefordert)',
      'Wir möchten ein Angebot anfordern.'
    );
    const html = formatTensesHtml(tenses);
    expect(html).toContain('<details class="tense-spoiler">');
    expect(html).toContain('<summary class="tense-summary">⏱️ Zeitformen & Grammatik ▾</summary>');
    expect(html).toContain('<span class="badge praes">Präsens</span>');
    expect(html).toContain('<span class="badge pass-alt">Passiversatz</span>');
  });
});
