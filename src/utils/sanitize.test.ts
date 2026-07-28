import { describe, it, expect } from 'vitest';
import { sanitizeHtml, cleanTextForSpeech } from './sanitize';

describe('sanitizeHtml', () => {
  it('returns empty string for null, undefined or empty input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('converts markdown bold and italic syntax to HTML tags', () => {
    expect(sanitizeHtml('This is **bold** text')).toBe('This is <b>bold</b> text');
    expect(sanitizeHtml('This is *italic* text')).toBe('This is <i>italic</i> text');
    expect(sanitizeHtml('**bold** and *italic*')).toBe('<b>bold</b> and <i>italic</i>');
  });

  it('sanitizes malicious script tags and XSS payloads', () => {
    const maliciousInput = '<script>alert("xss")</script>**test**';
    const cleanOutput = sanitizeHtml(maliciousInput);
    expect(cleanOutput).not.toContain('<script>');
    expect(cleanOutput).not.toContain('</script>');
    expect(cleanOutput).toContain('<b>test</b>');
  });
});

describe('cleanTextForSpeech', () => {
  it('returns empty string for empty inputs', () => {
    expect(cleanTextForSpeech(null)).toBe('');
    expect(cleanTextForSpeech(undefined)).toBe('');
    expect(cleanTextForSpeech('')).toBe('');
  });

  it('strips HTML tags and markdown formatting for speech synthesis', () => {
    const input = '<b>Hallo</b>, **Welt**! *Wie* geht es dir?';
    expect(cleanTextForSpeech(input)).toBe('Hallo, Welt! Wie geht es dir?');
  });

  it('normalizes multiple dots, ellipses and whitespace', () => {
    const input = 'Das ist...  gut…  ';
    expect(cleanTextForSpeech(input)).toBe('Das ist. gut.');
  });
});
