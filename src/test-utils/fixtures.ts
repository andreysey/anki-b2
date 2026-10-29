/**
 * Standardized test fixtures and mock helpers for anki-b2 tests.
 */
import { vi } from 'vitest';
import type { Word, SRSState } from '../types';
import type {
  AIServiceResponse,
  LanguageModelAvailability,
  LanguageModelStatic
} from '../utils/ai';

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

export const mockAIServiceResponse = (
  overrides?: Partial<AIServiceResponse>
): AIServiceResponse => ({
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

/** Installs a fake Chrome Prompt API (`globalThis.LanguageModel`). Remove with `clearLanguageModel()`. */
export const mockLanguageModel = (options?: {
  available?: LanguageModelAvailability;
  promptResponse?: string;
  streamChunks?: string[];
}) => {
  const promptMock = vi.fn().mockResolvedValue(options?.promptResponse ?? 'Mock on-device reply');
  const destroyMock = vi.fn();
  const availabilityMock = vi.fn().mockResolvedValue(options?.available ?? 'available');
  const createMock = vi.fn().mockImplementation(async () => ({
    prompt: promptMock,
    promptStreaming: options?.streamChunks
      ? async function* () {
          yield* options.streamChunks!;
        }
      : undefined,
    destroy: destroyMock
  }));

  const languageModel: LanguageModelStatic = {
    availability: availabilityMock,
    create: createMock
  };
  (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel = languageModel;

  return { promptMock, destroyMock, availabilityMock, createMock, languageModel };
};

export const clearLanguageModel = () => {
  delete (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel;
};

export const resetVocabularyState = async () => {
  const { useVocabulary, flushPendingSRS } = await import('../composables/useVocabulary');
  flushPendingSRS();
  const vocab = useVocabulary();
  vocab.vocabulary.value = [];
  vocab.isLoading.value = false;
  vocab.error.value = null;
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
