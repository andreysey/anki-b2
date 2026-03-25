import { ref, computed, watch } from 'vue';
import type { Word, SRSState, StudyDirection } from '../types';

export function useVocabulary() {
  const vocabulary = ref<Word[]>([]);
  const masteredIds = ref<Set<string>>(new Set());
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

  // Reset display limit when filters change
  watch([search, levelFilter, themaFilter], () => {
    displayLimit.value = 50;
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

  const filteredVocabulary = computed(() => {
    let list = vocabulary.value.filter(item => {
      const matchesSearch = !search.value || 
        item.german.toLowerCase().includes(search.value.toLowerCase()) ||
        item.english.toLowerCase().includes(search.value.toLowerCase()) ||
        item.ukrainian.toLowerCase().includes(search.value.toLowerCase());

      const matchesLevel = levelFilter.value === 'all' || item.level === levelFilter.value;
      const matchesThema = themaFilter.value === 'all' || item.thema.toString() === themaFilter.value;
      const isMastered = isStudyMode.value && masteredIds.value.has(getItemKey(item));

      return matchesSearch && matchesLevel && matchesThema && !isMastered;
    });

    if (isStudyMode.value) {
      list.sort((a, b) => {
        const keyA = getItemKey(a);
        const keyB = getItemKey(b);
        const srsA = srsData.value[keyA] || { level: 0, lastReview: 0 };
        const srsB = srsData.value[keyB] || { level: 0, lastReview: 0 };
        
        if (srsA.level !== srsB.level) return srsA.level - srsB.level;
        return srsA.lastReview - srsB.lastReview;
      });
    }

    return list;
  });

  const updateSRS = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const item = filteredVocabulary.value[currentStudyIndex.value];
    if (!item) return;
    
    const key = getItemKey(item);
    const current = srsData.value[key] || { level: 0, lastReview: 0 };
    
    let newLevel = current.level;
    if (rating === 'again') newLevel = 0;
    else if (rating === 'hard') newLevel = Math.max(0, current.level);
    else if (rating === 'good') newLevel = Math.min(5, current.level + 1);
    else if (rating === 'easy') newLevel = Math.min(5, current.level + 2);
    
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
    if (currentStudyIndex.value < filteredVocabulary.value.length - 1) {
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
    // We could implement shuffle on the computed list or a secondary ref
  };

  return {
    vocabulary,
    filteredVocabulary,
    search,
    levelFilter,
    themaFilter,
    isStudyMode,
    currentStudyIndex,
    isFlipped,
    studyDirection,
    isAutoplay,
    displayLimit,
    init,
    updateSRS,
    nextCard,
    prevCard,
    shuffleCards,
    loadMore: () => { displayLimit.value += 50 },
    getItemKey
  };
}
