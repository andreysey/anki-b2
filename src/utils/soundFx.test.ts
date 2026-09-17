import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playSoundFx, useSoundFx } from './soundFx';

describe('soundFx utils', () => {
  let originalAudioContext: typeof AudioContext;

  beforeEach(() => {
    originalAudioContext = window.AudioContext;
  });

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it('safely handles environments without Web Audio API without throwing', () => {
    // @ts-expect-error test simulation of missing AudioContext
    window.AudioContext = undefined;
    // @ts-expect-error test simulation of missing webkitAudioContext
    window.webkitAudioContext = undefined;

    expect(() => {
      playSoundFx('flip');
      playSoundFx('correct');
      playSoundFx('again');
      playSoundFx('celebrate');
      playSoundFx('click');
    }).not.toThrow();
  });

  it('provides reactive toggle via useSoundFx', () => {
    const { isSoundEnabled } = useSoundFx();
    expect(typeof isSoundEnabled.value).toBe('boolean');
  });
});
