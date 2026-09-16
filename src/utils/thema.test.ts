import { describe, it, expect } from 'vitest';
import { SPECIAL_THEMAS, getThemaLabel } from './thema';
import { THEMA_NUMBERS } from '../constants/themas';

describe('thema utils', () => {
  it('exports SPECIAL_THEMAS correctly', () => {
    expect(SPECIAL_THEMAS).toBeDefined();
    expect(SPECIAL_THEMAS[THEMA_NUMBERS.VERBEN]).toBe('Unregelmäßige Verben');
    expect(SPECIAL_THEMAS[THEMA_NUMBERS.PRAEPOSITIONEN]).toBe('Verben mit Präpositionen');
  });

  it('formats thema label properly', () => {
    expect(getThemaLabel(99)).toBe('Unregelmäßige Verben');
    expect(getThemaLabel(98)).toBe('Verben mit Präpositionen');
    expect(getThemaLabel(1)).toBe('Theme 1');
    expect(getThemaLabel(42)).toBe('Theme 42');
  });
});
