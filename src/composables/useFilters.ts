// Dictionary search and level/theme filters (shared module-level state).
import { ref, computed, watch } from 'vue';
import { normalizeGermanText, matchesSearchFilter, getItemKey } from '../utils/words';
import { useVocabularyData } from './useVocabularyData';
import { useProgress } from './useProgress';
import type { Word } from '../types';

const PAGE_SIZE = 24;

const search = ref('');
const levelFilter = ref('all');
const themaFilter = ref('all');
const displayLimit = ref(PAGE_SIZE);

// New filters start from the first page again
watch([search, levelFilter, themaFilter], () => {
  displayLimit.value = PAGE_SIZE;
});

/** Predicate for the current search, level and theme (reads, and so tracks, the filter refs). */
export const currentFilterMatcher = (): ((item: Word) => boolean) => {
  const rawQuery = search.value.trim().toLowerCase();
  const normalizedQuery = normalizeGermanText(rawQuery);
  const level = levelFilter.value;
  const thema = themaFilter.value;
  return (item) =>
    (level === 'all' || item.level === level) &&
    (thema === 'all' || item.thema.toString() === thema) &&
    matchesSearchFilter(item, rawQuery, normalizedQuery);
};

/** Unmastered words matching the search and filters. */
const filteredVocabulary = computed(() => {
  const { vocabulary } = useVocabularyData();
  const { masteredIds } = useProgress();
  const matches = currentFilterMatcher();
  return vocabulary.value.filter(
    (item) => !masteredIds.value.has(getItemKey(item)) && matches(item)
  );
});

const loadMore = () => {
  displayLimit.value += PAGE_SIZE;
};

export function useFilters() {
  return { search, levelFilter, themaFilter, displayLimit, filteredVocabulary, loadMore };
}
