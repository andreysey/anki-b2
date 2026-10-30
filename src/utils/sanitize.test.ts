// @vitest-environment jsdom
// DOMPurify is tested in jsdom: happy-dom leaves <script> elements in parsed HTML, so it
// would not show whether the real sanitizer works.
import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeAiHtml, cleanTextForSpeech, stripTags } from './sanitize';

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

  it('allows color style for highlighting but strips dangerous CSS properties', () => {
    const safeInput = '<b style="color: #eab308;">Highlight</b>';
    expect(sanitizeHtml(safeInput)).toContain('style="color: #eab308;"');

    const dangerousInput =
      '<span style="position: fixed; top: 0; z-index: 9999; color: red;">test</span>';
    const cleanOutput = sanitizeHtml(dangerousInput);
    expect(cleanOutput).not.toContain('position');
    expect(cleanOutput).not.toContain('fixed');
    expect(cleanOutput).not.toContain('z-index');
    expect(cleanOutput).toContain('color: red');
  });
});

describe('sanitizeAiHtml', () => {
  it('returns empty string for empty inputs', () => {
    expect(sanitizeAiHtml(null)).toBe('');
    expect(sanitizeAiHtml(undefined)).toBe('');
    expect(sanitizeAiHtml('')).toBe('');
  });

  it('strictly strips style attributes to prevent CSS injection / overlays', () => {
    const inputWithStyle =
      '<span style="position: fixed; top: 0; left: 0; z-index: 9999;">overlay</span>';
    const cleanOutput = sanitizeAiHtml(inputWithStyle);
    expect(cleanOutput).not.toContain('style=');
    expect(cleanOutput).not.toContain('position: fixed');
    expect(cleanOutput).toContain('overlay');
  });

  it('converts markdown bullet lists to semantic ul/li tags', () => {
    const input = '- Erste Regel\n- Zweite Regel';
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

describe('XSS payloads', () => {
  const payloads = [
    '<SCRIPT >alert(1)</script >',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '<iframe src="https://evil.example"></iframe>',
    '<b onclick="alert(1)">x</b>'
  ];

  it.each(payloads)('sanitizeHtml neutralizes %s', (payload) => {
    const out = sanitizeHtml(payload).toLowerCase();
    for (const bad of ['<script', '<img', '<svg', '<iframe', '<a', 'onerror', 'onload', 'onclick'])
      expect(out).not.toContain(bad);
  });

  it.each(payloads)('sanitizeAiHtml neutralizes %s', (payload) => {
    const out = sanitizeAiHtml(payload).toLowerCase();
    for (const bad of ['<script', '<img', '<svg', '<iframe', '<a', 'onerror', 'onload', 'onclick'])
      expect(out).not.toContain(bad);
  });

  it('sanitizeAiHtml drops every style attribute', () => {
    expect(sanitizeAiHtml('<span style="color: red">x</span>')).not.toContain('style');
  });
});

describe('stripTags', () => {
  it('returns plain text', () => {
    expect(stripTags('<b style="color: #eab308;">Antrag</b> stellen')).toBe('Antrag stellen');
  });
});
