// Study mode: which card is shown, its side, order (SRS-sorted or shuffled) and grading
// (shared module-level state).
import { ref, computed, watch } from 'vue';
import type { StudyDirection, Word } from '../types';
import { safeStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage';
import { compareStudyCards, type Rating } from '../utils/srs';
import { getItemKey } from '../utils/words';
import { useFilters } from './useFilters';
import { useProgress } from './useProgress';

const isStudyMode = ref(false);
const currentStudyIndex = ref(0);
const isFlipped = ref(false);
const studyDirection = ref<StudyDirection>('DE_TO_UA');
const isAutoplay = ref<boolean>(safeStorage.getItem<boolean>(STORAGE_KEYS.AUTOPLAY, false));
const isShuffled = ref(false);
const shuffledIndices = ref<number[]>([]);

watch(isAutoplay, (on) => safeStorage.setItem(STORAGE_KEYS.AUTOPLAY, on));

// A different filter is a different deck: drop the shuffle order
const { search, levelFilter, themaFilter, filteredVocabulary } = useFilters();
watch([search, levelFilter, themaFilter], () => {
  isShuffled.value = false;
  shuffledIndices.value = [];
});

const { srsData, recordReview, toggleMasteredKey } = useProgress();

/** Filtered cards, due ones first. Sorted once per change so cards don't jump mid-session. */
const sortedStudyVocabulary = computed(() => {
  const now = Date.now();
  return [...filteredVocabulary.value].sort((a, b) => compareStudyCards(a, b, srsData.value, now));
});

const studyList = computed(() => {
  const list = sortedStudyVocabulary.value;
  if (isShuffled.value && shuffledIndices.value.length === list.length) {
    return shuffledIndices.value.flatMap((idx) => list[idx] ?? []);
  }
  return list;
});

const nextCard = () => {
  if (currentStudyIndex.value < studyList.value.length - 1) {
    currentStudyIndex.value++;
    isFlipped.value = false;
  }
};

const prevCard = () => {
  if (currentStudyIndex.value > 0) {
    currentStudyIndex.value--;
    isFlipped.value = false;
  }
};

/** Grade the current card; good/easy move on, again/hard show it again from the front. */
const updateSRS = (rating: Rating) => {
  const item = studyList.value[currentStudyIndex.value];
  if (!item) return;
  recordReview(getItemKey(item), rating);
  if (rating === 'good' || rating === 'easy') nextCard();
  else isFlipped.value = false;
};

const toggleMastered = (item: Word) => {
  toggleMasteredKey(getItemKey(item));
  // Mastering removes the card from the list; keep the index inside it
  if (isStudyMode.value && currentStudyIndex.value >= studyList.value.length) {
    currentStudyIndex.value = Math.max(0, studyList.value.length - 1);
  }
};

const shuffleCards = () => {
  isShuffled.value = !isShuffled.value;
  if (isShuffled.value) {
    const indices = Array.from({ length: sortedStudyVocabulary.value.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // i and j are always within bounds (Fisher–Yates)
      [indices[i], indices[j]] = [indices[j]!, indices[i]!];
    }
    shuffledIndices.value = indices;
  } else {
    shuffledIndices.value = [];
  }
  currentStudyIndex.value = 0;
  isFlipped.value = false;
};

export function useStudySession() {
  return {
    isStudyMode,
    currentStudyIndex,
    isFlipped,
    studyDirection,
    isAutoplay,
    isShuffled,
    studyList,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    toggleMastered
  };
}
