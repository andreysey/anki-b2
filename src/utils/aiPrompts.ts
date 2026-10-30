// Prompts for the AI coach. ANSWER_LANGUAGE is filled in by callAI per backend
// (English on-device, Ukrainian in the cloud).
import type { Word } from '../types';
import { ANSWER_LANGUAGE } from './ai';

export type AIPromptType = 'grammar' | 'dialogue';

export interface AIPrompt {
  systemInstruction: string;
  prompt: string;
}

export function buildGrammarPrompt(word: Word): AIPrompt {
  return {
    systemInstruction:
      'You are a German language coach (CEFR B1/B2). ' +
      `Explain the German vocabulary term clearly in ${ANSWER_LANGUAGE} with bullet points. ` +
      'Do not repeat phrases. Be concise and structured.',
    prompt:
      `German word: ${word.german}\n` +
      `Example: ${word.example || 'N/A'}\n\n` +
      `Task: Provide meaning and grammar notes in ${ANSWER_LANGUAGE}.`
  };
}

export function buildDialoguePrompt(word: Word): AIPrompt {
  return {
    systemInstruction:
      'You are a German language coach. ' +
      'Write a concise 2-speaker German workplace dialogue (2-3 lines max) using the vocabulary word. ' +
      `Provide ${ANSWER_LANGUAGE} translation for each line. Do not repeat lines.`,
    prompt:
      `Word: ${word.german}\n` +
      `Format:\n` +
      `A: [German line]\n` +
      `  [${ANSWER_LANGUAGE} translation]\n` +
      `B: [German line]\n` +
      `  [${ANSWER_LANGUAGE} translation]`
  };
}

export const AI_PROMPTS: Record<AIPromptType, (word: Word) => AIPrompt> = {
  grammar: buildGrammarPrompt,
  dialogue: buildDialoguePrompt
};
