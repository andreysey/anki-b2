import { describe, it, expect } from 'vitest';
import { autoplayItems } from './useStudyAutoplay';
import { createMockWord } from '../test-utils/fixtures';

const card = createMockWord({
  german: 'die Abteilung, -en',
  german_audio: 'die Abteilung',
  english: 'department',
  example: 'Unsere Abteilung wächst.'
});

describe('autoplayItems', () => {
  it('DE → UA: front reads German, back reads English then the example', () => {
    expect(autoplayItems(card, 'DE_TO_UA', false)).toEqual([
      { text: 'die Abteilung', lang: 'de-DE' }
    ]);
    expect(autoplayItems(card, 'DE_TO_UA', true)).toEqual([
      { text: 'department', lang: 'en-US' },
      { text: 'Unsere Abteilung wächst.', lang: 'de-DE' }
    ]);
  });

  it('UA → DE: front reads English, back reads German then the example', () => {
    expect(autoplayItems(card, 'UA_TO_DE', false)).toEqual([{ text: 'department', lang: 'en-US' }]);
    expect(autoplayItems(card, 'UA_TO_DE', true)).toEqual([
      { text: 'die Abteilung', lang: 'de-DE' },
      { text: 'Unsere Abteilung wächst.', lang: 'de-DE' }
    ]);
  });

  it('falls back to the display text without german_audio and skips a missing example', () => {
    const bare = createMockWord({ german: 'der Vertrag', german_audio: '', example: '' });
    expect(autoplayItems(bare, 'UA_TO_DE', true)).toEqual([{ text: 'der Vertrag', lang: 'de-DE' }]);
  });
});
