// Study-mode actions with their sound/toast feedback, shared by buttons and keyboard shortcuts.
import { computed } from 'vue';
import type { SelectOption, StudyDirection } from '../types';
import { useVocabulary } from './useVocabulary';
import { playSoundFx } from '../utils/soundFx';
import { toast } from '../components/ui/sonner/toast';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const DIRECTION_OPTIONS: SelectOption<StudyDirection>[] = [
  { label: 'DE → EN/UA', value: 'DE_TO_UA' },
  { label: 'EN/UA → DE', value: 'UA_TO_DE' }
];

export const AUDIO_OPTIONS: SelectOption<boolean>[] = [
  { label: 'Audio On', value: true },
  { label: 'Audio Off', value: false }
];

export function useStudyActions() {
  const { studyList, currentStudyIndex, isFlipped, updateSRS, toggleMastered } = useVocabulary();

  const grade = (rating: Rating) => {
    playSoundFx(rating === 'again' ? 'again' : 'correct');
    updateSRS(rating);
  };

  const masterCurrentCard = () => {
    const card = studyList.value[currentStudyIndex.value];
    if (!card) return;
    playSoundFx('celebrate');
    toggleMastered(card);
    toast.success('Word marked as mastered');
  };

  const flip = () => {
    playSoundFx('flip');
    isFlipped.value = !isFlipped.value;
  };

  const studyProgress = computed(() => {
    const total = studyList.value.length;
    return total ? Math.round(((currentStudyIndex.value + 1) / total) * 100) : 0;
  });

  return { grade, masterCurrentCard, flip, studyProgress };
}
