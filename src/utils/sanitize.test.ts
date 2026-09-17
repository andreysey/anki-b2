import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeAiHtml, cleanTextForSpeech } from './sanitize';

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

describe('sanitizeAiHtml', () => {
  it('returns empty string for empty inputs', () => {
    expect(sanitizeAiHtml(null)).toBe('');
    expect(sanitizeAiHtml(undefined)).toBe('');
    expect(sanitizeAiHtml('')).toBe('');
  });

  it('strictly strips style attributes to prevent CSS injection / overlays', () => {
    const inputWithStyle = '<span style="position: fixed; top: 0; left: 0; z-index: 9999;">overlay</span>';
    const cleanOutput = sanitizeAiHtml(inputWithStyle);
    expect(cleanOutput).not.toContain('style=');
    expect(cleanOutput).not.toContain('position: fixed');
    expect(cleanOutput).toContain('overlay');
  });

  it('converts markdown bullet lists to semantic ul/li tags', () => {
    const input = "- Erste Regel\n- Zweite Regel";
    const cleanOutput = sanitizeAiHtml(input);
    expect(cleanOutput).toContain('<ul');
    expect(cleanOutput).toContain('<li>Erste Regel</li>');
    expect(cleanOutput).toContain('<li>Zweite Regel</li>');
  });

  it('converts backtick code blocks into inline code tags', () => {
    const input = 'Verwenden Sie `der Begriff` im Satz.';
    const cleanOutput = sanitizeAiHtml(input);
    expect(cleanOutput).toContain('<code');
    expect(cleanOutput).toContain('der Begriff');
  });

  it('sanitizes script tags in AI responses', () => {
    const maliciousInput = '<script>document.cookie</script>**Note**';
    const cleanOutput = sanitizeAiHtml(maliciousInput);
    expect(cleanOutput).not.toContain('<script>');
    expect(cleanOutput).toContain('<b>Note</b>');
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
