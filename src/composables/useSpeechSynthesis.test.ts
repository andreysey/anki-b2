import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSpeechSynthesis } from './useSpeechSynthesis';

describe('useSpeechSynthesis', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock SpeechSynthesisUtterance
    class MockSpeechSynthesisUtterance {
      text: string;
      lang = '';
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  });

  it('filters voices for German correctly', () => {
    const mockVoices: SpeechSynthesisVoice[] = [
      { name: 'Anna', lang: 'de-DE', voiceURI: 'anna-uri', default: true, localService: true },
      { name: 'David', lang: 'en-US', voiceURI: 'david-uri', default: false, localService: true },
      { name: 'Stefan', lang: 'de-AT', voiceURI: 'stefan-uri', default: false, localService: true }
    ];

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      cancel: vi.fn(),
      speak: vi.fn(),
      onvoiceschanged: null
    } as unknown as SpeechSynthesis;

    const { germanVoices, loadVoices, selectedVoiceURI } = useSpeechSynthesis();
    loadVoices();

    expect(germanVoices.value).toHaveLength(2);
    expect(germanVoices.value.map((v) => v.name)).toEqual(['Anna', 'Stefan']);
    expect(selectedVoiceURI.value).toBe('anna-uri');
  });

  it('playAudio cancels previous and speaks utterance', () => {
    const cancelMock = vi.fn();
    const speakMock = vi.fn();

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: cancelMock,
      speak: speakMock,
      onvoiceschanged: null
    } as unknown as SpeechSynthesis;

    const { playAudio } = useSpeechSynthesis();
    playAudio('Guten Tag');

    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();
  });

  it('handles missing window.speechSynthesis gracefully', () => {
    const originalSpeechSynthesis = window.speechSynthesis;
    // @ts-expect-error simulating missing API
    delete window.speechSynthesis;

    const { playAudio, playSequence, stopAudio, loadVoices } = useSpeechSynthesis();

    expect(() => loadVoices()).not.toThrow();
    expect(() => stopAudio()).not.toThrow();
    expect(() => playAudio('Test')).not.toThrow();
    expect(() => playSequence([{ text: 'Test' }])).not.toThrow();

    window.speechSynthesis = originalSpeechSynthesis;
  });

  it('handles playSequence with German and English voices', () => {
    const cancelMock = vi.fn();
    const speakMock = vi.fn();
    const mockVoices: SpeechSynthesisVoice[] = [
      { name: 'Anna', lang: 'de-DE', voiceURI: 'anna-uri', default: true, localService: true },
      { name: 'David', lang: 'en-US', voiceURI: 'david-uri', default: false, localService: true }
    ];

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      cancel: cancelMock,
      speak: speakMock,
      paused: true,
      resume: vi.fn(),
      onvoiceschanged: null
    } as unknown as SpeechSynthesis;

    const { playSequence, loadVoices } = useSpeechSynthesis();
    loadVoices();

    playSequence([
      { text: 'Hallo', lang: 'de-DE' },
      { text: 'Hello', lang: 'en-US' },
      { text: '   ' } // Should be skipped
    ]);

    expect(cancelMock).toHaveBeenCalled();
    expect(window.speechSynthesis.resume).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalledTimes(2);
  });

  it('clamps invalid or extreme ttsRate to safe bounds (0.5..2.0)', async () => {
    localStorage.setItem('anki_tts_rate', '999');
    const { ttsRate } = useSpeechSynthesis();
    expect(ttsRate.value).toBe(2.0);

    ttsRate.value = 0.1;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(localStorage.getItem('anki_tts_rate')).toBe('0.5');
  });
});

