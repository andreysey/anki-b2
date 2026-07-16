import { ref, computed, watch } from 'vue';
import type { Word, SRSState, StudyDirection } from '../types';

const LEVEL_TRANSITIONS: Record<'again' | 'hard' | 'good' | 'easy', (level: number) => number> = {
  again: () => 0,
  hard: (level) => Math.max(0, level),
  good: (level) => Math.min(5, level + 1),
  easy: (level) => Math.min(5, level + 2),
};

export function useVocabulary() {
  const vocabulary = ref<Word[]>([]);
  
  // Load masteredIds from localStorage
  const masteredIds = ref<Set<string>>(new Set(
    JSON.parse(localStorage.getItem('anki_mastered_words') || '[]')
  ));
  
  const srsData = ref<Record<string, SRSState>>(
    JSON.parse(localStorage.getItem('anki_srs_v2') || '{}')
  );

  const search = ref('');
  const levelFilter = ref('all');
  const themaFilter = ref('all');
  const displayLimit = ref(50);
  
  const isStudyMode = ref(false);
  const currentStudyIndex = ref(0);
  const isFlipped = ref(false);
  const studyDirection = ref<StudyDirection>('DE_TO_UA');
  const isAutoplay = ref(false);

  // Shuffle state
  const isShuffled = ref(false);
  const shuffledIndices = ref<number[]>([]);

  // Reset display limit and shuffle when filters change
  watch([search, levelFilter, themaFilter], () => {
    displayLimit.value = 50;
    isShuffled.value = false;
    shuffledIndices.value = [];
  });

  // Load data
  const init = async () => {
    try {
      const response = await fetch('data.json');
      vocabulary.value = await response.json();
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    }
  };

  const saveSRS = () => {
    localStorage.setItem('anki_srs_v2', JSON.stringify(srsData.value));
  };

  const getItemKey = (item: Word) => item.id || `${item.german}-${item.thema}`;

  const toggleMastered = (item: Word) => {
    const key = getItemKey(item);
    if (masteredIds.value.has(key)) {
      masteredIds.value.delete(key);
    } else {
      masteredIds.value.add(key);
    }
    localStorage.setItem('anki_mastered_words', JSON.stringify(Array.from(masteredIds.value)));
    
    // Safety check for study index after removing a card from the list
    if (isStudyMode.value && currentStudyIndex.value >= studyList.value.length) {
      currentStudyIndex.value = Math.max(0, studyList.value.length - 1);
    }
  };

  const filteredVocabulary = computed(() => {
    return vocabulary.value.filter(item => {
      const matchesSearch = !search.value || 
        item.german.toLowerCase().includes(search.value.toLowerCase()) ||
        item.english.toLowerCase().includes(search.value.toLowerCase()) ||
        item.ukrainian.toLowerCase().includes(search.value.toLowerCase());

      const matchesLevel = levelFilter.value === 'all' || item.level === levelFilter.value;
      const matchesThema = themaFilter.value === 'all' || item.thema.toString() === themaFilter.value;
      const isMastered = masteredIds.value.has(getItemKey(item));

      return matchesSearch && matchesLevel && matchesThema && !isMastered;
    });
  });

  // Base list of cards for study mode, sorted by SRS
  const sortedStudyVocabulary = computed(() => {
    const list = [...filteredVocabulary.value];
    list.sort((a, b) => {
      const keyA = getItemKey(a);
      const keyB = getItemKey(b);
      const srsA = srsData.value[keyA] || { level: 0, lastReview: 0 };
      const srsB = srsData.value[keyB] || { level: 0, lastReview: 0 };
      
      if (srsA.level !== srsB.level) return srsA.level - srsB.level;
      return srsA.lastReview - srsB.lastReview;
    });
    return list;
  });

  // Final study list (either sorted or shuffled)
  const studyList = computed(() => {
    const list = sortedStudyVocabulary.value;
    if (isShuffled.value && shuffledIndices.value.length === list.length) {
      return shuffledIndices.value.map(idx => list[idx]);
    }
    return list;
  });

  const updateSRS = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const item = studyList.value[currentStudyIndex.value];
    if (!item) return;
    
    const key = getItemKey(item);
    const current = srsData.value[key] || { level: 0, lastReview: 0 };
    
    const newLevel = LEVEL_TRANSITIONS[rating](current.level);
    
    srsData.value[key] = {
      level: newLevel,
      lastReview: Date.now()
    };
    saveSRS();

    if (rating === 'good' || rating === 'easy') {
      nextCard();
    } else {
      isFlipped.value = false;
    }
  };

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

  const shuffleCards = () => {
    isShuffled.value = !isShuffled.value;
    if (isShuffled.value) {
      const len = sortedStudyVocabulary.value.length;
      const indices = Array.from({ length: len }, (_, i) => i);
      for (let i = len - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      shuffledIndices.value = indices;
    } else {
      shuffledIndices.value = [];
    }
    currentStudyIndex.value = 0;
    isFlipped.value = false;
  };

  return {
    vocabulary,
    filteredVocabulary,
    studyList,
    search,
    levelFilter,
    themaFilter,
    isStudyMode,
    currentStudyIndex,
    isFlipped,
    studyDirection,
    isAutoplay,
    isShuffled,
    masteredIds,
    displayLimit,
    init,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    toggleMastered,
    loadMore: () => { displayLimit.value += 50 },
    getItemKey
  };
}
