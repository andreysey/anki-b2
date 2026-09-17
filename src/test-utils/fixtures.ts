/**
 * Standardized test fixtures and mock helpers for anki-b2 tests.
 */
import { vi } from 'vitest';
import type { Word, SRSState } from '../types';
import type { AILanguageModel, AIServiceResponse } from '../utils/ai';

export const createMockWord = (overrides?: Partial<Word>): Word => ({
  id: 'word-1',
  level: 'B2',
  thema: 1,
  german: 'die Abteilung, -en',
  german_audio: 'die Abteilung',
  english: 'department',
  ukrainian: 'відділ',
  example: 'Unsere Abteilung ist für Sicherheit zuständig.',
  ...overrides
});

export const createMockWords = (count: number, baseOverrides?: Partial<Word>): Word[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockWord({
      id: `word-${i + 1}`,
      german: `Begriff ${i + 1}`,
      german_audio: `Begriff ${i + 1}`,
      english: `Term ${i + 1}`,
      ukrainian: `Термін ${i + 1}`,
      example: `Das ist ein Beispielsatz für Begriff ${i + 1}.`,
      ...baseOverrides
    })
  );
};

export const createMockSRSState = (overrides?: Partial<SRSState>): SRSState => ({
  level: 1,
  lastReview: Date.now(),
  ...overrides
});

export const mockAIServiceResponse = (overrides?: Partial<AIServiceResponse>): AIServiceResponse => ({
  success: true,
  text: 'Mock German coach explanation',
  source: 'cloud',
  model: 'gemini-flash-lite-latest',
  ...overrides
});

export const mockSpeechSynthesisInstance = () => {
  const speakMock = vi.fn();
  const cancelMock = vi.fn();
  const pauseMock = vi.fn();
  const resumeMock = vi.fn();
  const getVoicesMock = vi.fn(() => [
    { voiceURI: 'de-DE-default', name: 'German Standard', lang: 'de-DE' } as SpeechSynthesisVoice,
    { voiceURI: 'en-US-default', name: 'English Standard', lang: 'en-US' } as SpeechSynthesisVoice
  ]);

  if (typeof window !== 'undefined') {
    window.speechSynthesis = {
      speak: speakMock,
      cancel: cancelMock,
      pause: pauseMock,
      resume: resumeMock,
      getVoices: getVoicesMock,
      paused: false,
      pending: false,
      speaking: false,
      onvoiceschanged: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    } as unknown as SpeechSynthesis;
  }

  return {
    speakMock,
    cancelMock,
    pauseMock,
    resumeMock,
    getVoicesMock
  };
};

export const mockWindowAI = (options?: {
  available?: 'readily' | 'after-download' | 'no';
  promptResponse?: string;
}) => {
  const promptMock = vi.fn().mockResolvedValue(options?.promptResponse ?? 'Mock on-device reply');
  const destroyMock = vi.fn();

  const languageModel: AILanguageModel = {
    capabilities: async () => ({ available: options?.available ?? 'readily' }),
    availability: async () => options?.available ?? 'readily',
    create: async () => ({
      prompt: promptMock,
      destroy: destroyMock
    })
  };

  if (typeof window !== 'undefined') {
    window.ai = {
      languageModel,
      assistant: languageModel
    };
  }

  return {
    promptMock,
    destroyMock,
    languageModel
  };
};

export const resetVocabularyState = async () => {
  const { useVocabulary } = await import('../composables/useVocabulary');
  const vocab = useVocabulary();
  vocab.vocabulary.value = [];
  vocab.masteredIds.value = new Set<string>();
  vocab.srsData.value = {};
  vocab.studyStreak.value = { lastDate: '', streak: 0 };
  vocab.sessionReviewedCount.value = 0;
  vocab.search.value = '';
  vocab.levelFilter.value = 'all';
  vocab.themaFilter.value = 'all';
  vocab.displayLimit.value = 24;
  vocab.isStudyMode.value = false;
  vocab.currentStudyIndex.value = 0;
  vocab.isFlipped.value = false;
  vocab.studyDirection.value = 'DE_TO_UA';
  vocab.isAutoplay.value = false;
  vocab.isShuffled.value = false;
};
