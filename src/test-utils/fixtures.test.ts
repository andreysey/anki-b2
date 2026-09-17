import { describe, it, expect } from 'vitest';
import {
  createMockWord,
  createMockWords,
  createMockSRSState,
  mockAIServiceResponse,
  mockSpeechSynthesisInstance,
  mockWindowAI
} from './fixtures';

describe('test fixtures', () => {
  it('creates mock word with default and overridden properties', () => {
    const word = createMockWord({ level: 'B1+' });
    expect(word.level).toBe('B1+');
    expect(word.german).toBe('die Abteilung, -en');
  });

  it('creates an array of mock words', () => {
    const words = createMockWords(3);
    expect(words).toHaveLength(3);
    expect(words[0].id).toBe('word-1');
    expect(words[2].id).toBe('word-3');
  });

  it('creates mock SRS state', () => {
    const srs = createMockSRSState({ level: 4 });
    expect(srs.level).toBe(4);
    expect(srs.lastReview).toBeGreaterThan(0);
  });

  it('creates mock AI service response', () => {
    const response = mockAIServiceResponse({ source: 'nano' });
    expect(response.success).toBe(true);
    expect(response.source).toBe('nano');
  });

  it('mocks window.speechSynthesis', () => {
    const { getVoicesMock } = mockSpeechSynthesisInstance();
    expect(window.speechSynthesis).toBeDefined();
    expect(window.speechSynthesis.getVoices()).toHaveLength(2);
    expect(getVoicesMock).toHaveBeenCalled();
  });

  it('mocks window.ai language model', async () => {
    const { promptMock, destroyMock } = mockWindowAI({ promptResponse: 'Gut gemacht!' });
    expect(window.ai?.languageModel).toBeDefined();
    const session = await window.ai!.languageModel!.create();
    const res = await session.prompt('Test');
    session.destroy();
    expect(res).toBe('Gut gemacht!');
    expect(promptMock).toHaveBeenCalledWith('Test');
    expect(destroyMock).toHaveBeenCalled();
  });
});
