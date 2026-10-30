// Dictionary search and level/theme filters (shared module-level state).
import { ref, computed, watch } from 'vue';
import { normalizeGermanText, matchesSearchFilter, getItemKey } from '../utils/words';
import { useVocabularyData } from './useVocabularyData';
import { useProgress } from './useProgress';

const PAGE_SIZE = 24;

const search = ref('');
const levelFilter = ref('all');
const themaFilter = ref('all');
const displayLimit = ref(PAGE_SIZE);

// New filters start from the first page again
watch([search, levelFilter, themaFilter], () => {
  displayLimit.value = PAGE_SIZE;
});

/** Unmastered words matching the search and filters. */
const filteredVocabulary = computed(() => {
  const { vocabulary } = useVocabularyData();
  const { masteredIds } = useProgress();
  const rawQuery = search.value.trim().toLowerCase();
  const normalizedQuery = normalizeGermanText(rawQuery);

  return vocabulary.value.filter(
    (item) =>
      !masteredIds.value.has(getItemKey(item)) &&
      (levelFilter.value === 'all' || item.level === levelFilter.value) &&
      (themaFilter.value === 'all' || item.thema.toString() === themaFilter.value) &&
      matchesSearchFilter(item, rawQuery, normalizedQuery)
  );
});

const loadMore = () => {
  displayLimit.value += PAGE_SIZE;
};

export function useFilters() {
  return { search, levelFilter, themaFilter, displayLimit, filteredVocabulary, loadMore };
}
