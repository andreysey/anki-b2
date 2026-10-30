import { describe, it, expect } from 'vitest';
import { AI_PROMPTS } from './aiPrompts';
import { ANSWER_LANGUAGE } from './ai';
import { createMockWord } from '../test-utils/fixtures';

describe('AI prompts', () => {
  const word = createMockWord({ german: 'die Abteilung', example: 'Unsere Abteilung wächst.' });

  it('grammar prompt includes the word, example and answer-language placeholder', () => {
    const { prompt, systemInstruction } = AI_PROMPTS.grammar(word);
    expect(prompt).toContain('die Abteilung');
    expect(prompt).toContain('Unsere Abteilung wächst.');
    expect(systemInstruction).toContain(ANSWER_LANGUAGE);
  });

  it('dialogue prompt asks for translations in the answer language', () => {
    const { prompt, systemInstruction } = AI_PROMPTS.dialogue(word);
    expect(prompt).toContain('Word: die Abteilung');
    expect(prompt).toContain(`[${ANSWER_LANGUAGE} translation]`);
    expect(systemInstruction).toContain('dialogue');
  });

  it('falls back when there is no example', () => {
    expect(AI_PROMPTS.grammar(createMockWord({ example: '' })).prompt).toContain('Example: N/A');
  });
});
