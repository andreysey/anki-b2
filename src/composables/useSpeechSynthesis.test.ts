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
      { name: 'Stefan', lang: 'de-AT', voiceURI: 'stefan-uri', default: false, localService: true },
    ];

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue(mockVoices),
      cancel: vi.fn(),
      speak: vi.fn(),
      onvoiceschanged: null,
    } as unknown as SpeechSynthesis;

    const { germanVoices, loadVoices, selectedVoiceURI } = useSpeechSynthesis();
    loadVoices();

    expect(germanVoices.value).toHaveLength(2);
    expect(germanVoices.value.map(v => v.name)).toEqual(['Anna', 'Stefan']);
    expect(selectedVoiceURI.value).toBe('anna-uri');
  });

  it('playAudio cancels previous and speaks utterance', () => {
    const cancelMock = vi.fn();
    const speakMock = vi.fn();

    window.speechSynthesis = {
      getVoices: vi.fn().mockReturnValue([]),
      cancel: cancelMock,
      speak: speakMock,
      onvoiceschanged: null,
    } as unknown as SpeechSynthesis;

    const { playAudio } = useSpeechSynthesis();
    playAudio('Guten Tag');

    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();
  });
});
