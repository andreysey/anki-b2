// Reads the current card aloud when autoplay is on: the front side, then (after flipping)
// the translation and the German example sentence.
import { watch } from 'vue';
import type { StudyDirection, Word } from '../types';
import { useVocabulary } from './useVocabulary';

export interface SpeechItem {
  text: string;
  lang: string;
}

/** What to read for a card side. The back reads the other language, then the example. */
export function autoplayItems(
  card: Word,
  direction: StudyDirection,
  flipped: boolean
): SpeechItem[] {
  const german: SpeechItem = { text: card.german_audio || card.german, lang: 'de-DE' };
  const english: SpeechItem = { text: card.english, lang: 'en-US' };
  const frontIsGerman = direction === 'DE_TO_UA';

  if (!flipped) return [frontIsGerman ? german : english];
  const items = [frontIsGerman ? english : german];
  if (card.example) items.push({ text: card.example, lang: 'de-DE' });
  return items;
}

export function useStudyAutoplay(speech: {
  playAudio: (text: string, lang?: string) => void;
  playSequence: (items: SpeechItem[]) => void;
}) {
  const { studyList, currentStudyIndex, isFlipped, isStudyMode, isAutoplay, studyDirection } =
    useVocabulary();

  watch(
    [currentStudyIndex, isFlipped, isStudyMode, isAutoplay],
    ([index, flipped, studying, on]) => {
      if (!studying || !on) return;
      const card = studyList.value[index];
      if (!card) return;

      const items = autoplayItems(card, studyDirection.value, flipped);
      const [front] = items;
      if (flipped) speech.playSequence(items);
      else if (front) speech.playAudio(front.text, front.lang);
    }
  );
}
