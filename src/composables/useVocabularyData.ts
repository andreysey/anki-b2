// The vocabulary list, loaded once from data.json (shared module-level state).
import { ref } from 'vue';
import type { Word } from '../types';
import { buildSearchIndex } from '../utils/words';

const vocabulary = ref<Word[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

type WindowWithPreload = Window & { __DATA_PROMISE__?: Promise<Word[] | null> };

/** index.html starts fetching data.json early; reuse that request if it exists. */
async function fetchVocabulary(): Promise<Word[] | null> {
  const preloaded =
    typeof window !== 'undefined' ? await (window as WindowWithPreload).__DATA_PROMISE__ : null;
  if (preloaded) return preloaded;

  const response = await fetch('data.json');
  if (!response.ok) throw new Error(`Failed to fetch vocabulary data: HTTP ${response.status}`);
  return response.json();
}

async function loadVocabulary(): Promise<void> {
  if (vocabulary.value.length) return; // Already loaded
  isLoading.value = true;
  error.value = null;
  try {
    const data = await fetchVocabulary();
    if (data) {
      for (const item of data) item._searchIndex = buildSearchIndex(item);
      vocabulary.value = data;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error fetching vocabulary:', message);
    error.value = message;
  } finally {
    isLoading.value = false;
  }
}

export function useVocabularyData() {
  return { vocabulary, isLoading, error, loadVocabulary };
}
