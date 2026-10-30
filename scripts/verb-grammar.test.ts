import { describe, it, expect } from 'vitest';
import { buildVerbTenses, formatTensesHtml } from './verb-grammar.ts';

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
    expect(findTense('Futur II (Vermutung)')).toBe(
      'Er wird wohl schon das Angebot angefordert haben.'
    );
    expect(findTense('Passiv')).toBe('Das Angebot wird / wurde angefordert.');
    expect(findTense('Passiversatz')).toBe('Das Angebot lässt sich anfordern · ist anzufordern.');
    expect(findTense('Konjunktiv I')).toBe('Er sagte, er fordere das Angebot an.');
    expect(findTense('Konjunktiv II')).toBe(
      'Er würde das Angebot anfordern · hätte das Angebot angefordert.'
    );
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
    expect(findTense('Konjunktiv II')).toBe(
      'Er würde sich um die Stelle bewerben · hätte sich beworben.'
    );
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
    expect(findTense('Futur II (Vermutung)')).toBe(
      'Er wird wohl schon rechtzeitig aufgewachsen sein.'
    );
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

  const sentences = (german: string, example = '') =>
    Object.fromEntries((buildVerbTenses(german, example) ?? []).map((t) => [t.code, t.sentence]));

  it('places sich once for reflexive verbs with a separable prefix (sich weiterbilden)', () => {
    const t = sentences(
      'sich weiter|bilden (bildet sich weiter, bildete sich weiter, hat sich weitergebildet)'
    );
    expect(t.praes).toBe('Er bildet sich weiter.');
    expect(t.praet).toBe('Gestern bildete er sich weiter.');
    expect(t.perf).toBe('Er hat sich weitergebildet.');
    expect(Object.values(t).join(' ')).not.toMatch(/\bsich\s+sich\b/);
  });

  it('splits separable transitive verbs and builds passive forms (eingeben)', () => {
    const t = sentences('etw. ein|geben (gibt ein, gab ein, hat eingegeben)');
    expect(t.praes).toBe('Er gibt das Dokument ein.');
    expect(t.praet).toBe('Gestern gab er das Dokument ein.');
    expect(t.pass).toBe('Das Dokument wird / wurde eingegeben.');
    expect(t['pass-alt']).toBe('Das Dokument lässt sich eingeben · ist einzugeben.');
    expect(t.konj1).toBe('Er sagte, er gebe das Dokument ein.');
  });

  it('uses sein for perfect tenses of motion verbs and skips the passive (kommen)', () => {
    const t = sentences('kommen (kommt, kam, ist gekommen)');
    expect(t.perf).toMatch(/^Er ist .*gekommen\.$/);
    expect(t.plusq).toMatch(/^Er war .*gekommen\.$/);
    expect(t.konj2).toMatch(/wäre .*gekommen\.$/);
    expect(t.pass).toContain('Nicht passivfähig');
  });

  it('marks reflexive verbs as not passivizable (sich bewerben)', () => {
    const t = sentences('sich bewerben (bewirbt sich, bewarb sich, hat sich beworben)');
    expect(t.praes).toBe('Er bewirbt sich.');
    expect(t.pass).toContain('reflexives Verb');
  });
});
