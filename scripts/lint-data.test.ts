import { describe, it, expect } from 'vitest';
import { validateLine, type ValidationIssue } from './lint-data.js';

describe('lint-data validateLine', () => {
  it('returns no issues for valid formatted lines', () => {
    const validLine = 'der Tisch, -e;table;стіл;Der **Tisch** ist groß.';
    const issues = validateLine(validLine);
    expect(issues).toEqual([]);
  });

  it('ignores comments and empty lines', () => {
    expect(validateLine('# Comment line')).toEqual([]);
    expect(validateLine('')).toEqual([]);
    expect(validateLine('   ')).toEqual([]);
  });

  it('flags incorrect delimiter count', () => {
    const invalidLine = 'der Tisch;table;стіл'; // only 2 semicolons
    const issues = validateLine(invalidLine);
    expect(issues.some((i: ValidationIssue) => i.type === 'error' && i.category === 'Format')).toBe(true);
  });

  it('flags missing German term', () => {
    const missingGerman = ';table;стіл;Example sentence.';
    const issues = validateLine(missingGerman);
    expect(issues.some((i: ValidationIssue) => i.type === 'error' && i.category === 'Missing German Term')).toBe(true);
  });

  it('flags missing Ukrainian translation', () => {
    const missingUkr = 'das Haus;house;;Das Haus ist neu.';
    const issues = validateLine(missingUkr);
    expect(issues.some((i: ValidationIssue) => i.type === 'error' && i.category === 'Missing Ukrainian')).toBe(true);
  });

  it('warns about missing English translation', () => {
    const missingEng = 'das Haus;;будинок;Das Haus ist neu.';
    const issues = validateLine(missingEng);
    expect(issues.some((i: ValidationIssue) => i.type === 'warning' && i.category === 'Missing English')).toBe(true);
  });

  it('detects Cyrillic characters in German and English fields', () => {
    const cyrillicGerman = 'der Тіsch;table;стіл;Der Tisch ist groß.'; // Ukrainian 'і'
    const issuesGerman = validateLine(cyrillicGerman);
    expect(issuesGerman.some((i: ValidationIssue) => i.type === 'error' && i.category === 'Cyrillic in German')).toBe(true);

    const cyrillicEnglish = 'der Tisch;tаble;стіл;Der Tisch ist groß.'; // Cyrillic 'а'
    const issuesEnglish = validateLine(cyrillicEnglish);
    expect(issuesEnglish.some((i: ValidationIssue) => i.type === 'error' && i.category === 'Cyrillic in English')).toBe(true);
  });

  it('warns when example uses isolated uppercase abbreviation', () => {
    const abbrLine = 'der Personalausweis (PA);ID card;паспорт;Zeigen Sie bitte den PA vor.';
    const issues = validateLine(abbrLine);
    expect(issues.some((i: ValidationIssue) => i.type === 'warning' && i.category === 'Abbreviation Alert')).toBe(true);
  });
});
