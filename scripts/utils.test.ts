import { describe, it, expect } from 'vitest';
import {
  cleanGermanForAudio,
  cleanExampleForAudio,
  colorizeGender,
  highlightWordInExample,
  getThemaNum,
  getLevelFromFilename
} from './utils.js';

describe('cleanGermanForAudio', () => {
  it('strips parentheses, alternatives, prefixes and formatting', () => {
    expect(cleanGermanForAudio('')).toBe('');
    expect(cleanGermanForAudio('jdn. an|rufen (ruft an, rief an)')).toBe('anrufen');
    expect(cleanGermanForAudio('etw. kaufen/verkaufen')).toBe('kaufen');
    expect(cleanGermanForAudio('*das* Buch, -¨er')).toBe('das Buch');
  });

  it('handles complex grammatical prefixes like etw./jdn., jdm. etw., and sich etw.', () => {
    expect(
      cleanGermanForAudio('etw./jdn. abfertigen (fertigt ab, fertigte ab, hat abgefertigt)')
    ).toBe('abfertigen');
    expect(
      cleanGermanForAudio(
        'etw./jdn. beaufsichtigen (beaufsichtigt, beaufsichtigte, hat beaufsichtigt)'
      )
    ).toBe('beaufsichtigen');
    expect(
      cleanGermanForAudio('jdn./etw. beobachten (beobachtet, beobachtete, hat beobachtet)')
    ).toBe('beobachten');
    expect(cleanGermanForAudio('etw./jdm. Beachtung schenken')).toBe('Beachtung schenken');
    expect(cleanGermanForAudio('jdm. etw. raten (rät, riet, hat geraten)')).toBe('raten');
    expect(cleanGermanForAudio('sich etw. merken (merkt sich, merkte sich, hat sich gemerkt)')).toBe(
      'sich merken'
    );
    expect(cleanGermanForAudio('der/die Vorgesetzte, -n')).toBe('der Vorgesetzte');
    expect(cleanGermanForAudio('der/die Beschäftigte, -n')).toBe('der Beschäftigte');
    expect(cleanGermanForAudio('der Arbeitgeber, - / die Arbeitgeberin, -nen')).toBe(
      'der Arbeitgeber'
    );
    expect(cleanGermanForAudio('das Praktikum, Praktika')).toBe('das Praktikum');
    expect(cleanGermanForAudio('Ja, das passt / das geht. Einverstanden.')).toBe('Ja, das passt');
  });
});

describe('cleanExampleForAudio', () => {
  it('strips html tags, formatting and normalizes dots', () => {
    expect(cleanExampleForAudio('')).toBe('');
    expect(cleanExampleForAudio('<b>Er</b> geht... nach Hause.')).toBe('Er geht. nach Hause.');
    expect(cleanExampleForAudio('Das ist *gut*…')).toBe('Das ist gut.');
  });
});

describe('colorizeGender', () => {
  it('wraps der, die, das articles in colored spans', () => {
    expect(colorizeGender('der Mann')).toBe(
      '<span style="color: #00d2ff; font-weight: bold;">der</span> Mann'
    );
    expect(colorizeGender('die Frau')).toBe(
      '<span style="color: #ef4444; font-weight: bold;">die</span> Frau'
    );
    expect(colorizeGender('das Kind')).toBe(
      '<span style="color: #22c55e; font-weight: bold;">das</span> Kind'
    );
    expect(colorizeGender('laufen')).toBe('laufen');
  });
});

describe('highlightWordInExample', () => {
  it('returns empty string if example is empty', () => {
    expect(highlightWordInExample('Haus', '')).toBe('');
  });

  it('highlights German word or verb form in sentence', () => {
    const cleanGerman = 'schlafen';
    const example = 'Er schläft sehr tief.';
    const originalGerman = 'schlafen (schläft, schlief, hat geschlafen)';
    const highlighted = highlightWordInExample(cleanGerman, example, originalGerman);
    expect(highlighted).toContain('<b style="color: #eab308;">schläft</b>');
  });

  it('handles separable verb Partizip II fallback with ge- prefix', () => {
    const cleanGerman = 'ab|fangen';
    const example = 'Der Ball wurde abgefangen.';
    const highlighted = highlightWordInExample(cleanGerman, example);
    expect(highlighted).toContain('<b style="color: #eab308;">abgefangen</b>');
  });

  it('handles compound noun fallback', () => {
    const cleanGerman = 'Rentenberater';
    const example = 'Er arbeitet als Chefrentenberater.';
    const highlighted = highlightWordInExample(cleanGerman, example);
    expect(highlighted).toContain('<b style="color: #eab308;">Chefrentenberater</b>');
  });
});

describe('getThemaNum', () => {
  it('extracts special numbers for category files or Thema number', () => {
    expect(getThemaNum('B2_Redemittel.txt')).toBe(95);
    expect(getThemaNum('B2_Nomen_Verb.txt')).toBe(96);
    expect(getThemaNum('B2_Adjektive.txt')).toBe(97);
    expect(getThemaNum('B2_Praepositionen.txt')).toBe(98);
    expect(getThemaNum('B2_Verben.txt')).toBe(99);
    expect(getThemaNum('B2_Thema03_Arbeit.txt')).toBe(3);
    expect(getThemaNum('Unknown.txt')).toBe(0);
  });
});

describe('getLevelFromFilename', () => {
  it('detects level B1+ vs B2 from filename', () => {
    expect(getLevelFromFilename('B1_plus_Thema01.txt')).toBe('B1+');
    expect(getLevelFromFilename('B2_Thema01.txt')).toBe('B2');
  });
});
