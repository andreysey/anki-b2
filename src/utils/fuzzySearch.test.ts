import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, matchesFuzzy, filterWordsFuzzy } from './fuzzySearch';
import type { Word } from '../types';

const mockWords: Word[] = [
  {
    id: '1',
    german: 'übernehmen',
    german_audio: 'übernehmen',
    english: 'to take over, assume',
    ukrainian: 'переймати, брати на себе',
    example: 'Er übernimmt die Verantwortung.',
    level: 'B2',
    thema: 1
  },
  {
    id: '2',
    german: 'die Straße',
    german_audio: 'die Straße',
    english: 'street',
    ukrainian: 'вулиця',
    example: 'Die Straße ist gesperrt.',
    level: 'B2',
    thema: 2
  },
  {
    id: '3',
    german: 'der Vertrag',
    german_audio: 'der Vertrag',
    english: 'contract',
    ukrainian: 'договір',
    example: 'Wir unterschreiben den Vertrag.',
    level: 'B2',
    thema: 3
  }
];

describe('fuzzySearch utils', () => {
  it('calculates correct Levenshtein distance', () => {
    expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(getLevenshteinDistance('vertrag', 'vertrag')).toBe(0);
    expect(getLevenshteinDistance('vertrag', 'vertrage')).toBe(1);
  });

  it('matches umlaut alternatives (ue for ü, ss for ß)', () => {
    expect(matchesFuzzy('übernehmen', 'uebernehmen')).toBe(true);
    expect(matchesFuzzy('übernehmen', 'ubernehmen')).toBe(true);
    expect(matchesFuzzy('die Straße', 'strasse')).toBe(true);
  });

  it('handles typos within edit distance 1 for tokens of length >= 4', () => {
    expect(matchesFuzzy('der Vertrag', 'vertag')).toBe(true);
    expect(matchesFuzzy('der Vertrag', 'vertragg')).toBe(true);
    expect(matchesFuzzy('der Vertrag', 'completelydifferent')).toBe(false);
  });

  it('filters vocabulary accurately with fuzzy tolerance', () => {
    const results = filterWordsFuzzy(mockWords, 'ueber');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].german).toContain('übernehmen');
  });
});
