<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { Search, X, Volume2, Check, ArrowRight } from '@lucide/vue';
import type { Word } from '../types';
import { sanitizeHtml } from '../utils/sanitize';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';
import { filterWordsFuzzy } from '../utils/fuzzySearch';

const props = defineProps<{
  isOpen: boolean;
  vocabulary: Word[];
  masteredIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'select-word', word: Word): void;
  (e: 'play-audio', text: string): void;
  (e: 'toggle-mastered', word: Word): void;
}>();

const searchQuery = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

const filteredWords = computed(() => {
  return filterWordsFuzzy(props.vocabulary, searchQuery.value, 15);
});

const previouslyFocusedElement = ref<HTMLElement | null>(null);

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      if (typeof document !== 'undefined') {
        previouslyFocusedElement.value = document.activeElement as HTMLElement | null;
      }
      searchQuery.value = '';
      selectedIndex.value = 0;
      await nextTick();
      inputRef.value?.focus();
    } else {
      if (previouslyFocusedElement.value && typeof previouslyFocusedElement.value.focus === 'function') {
        previouslyFocusedElement.value.focus();
        previouslyFocusedElement.value = null;
      }
    }
  }
);

watch(filteredWords, () => {
  selectedIndex.value = 0;
});

const close = () => {
  emit('update:isOpen', false);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    close();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (filteredWords.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredWords.value.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (filteredWords.value.length > 0) {
      selectedIndex.value =
        (selectedIndex.value - 1 + filteredWords.value.length) % filteredWords.value.length;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const item = filteredWords.value[selectedIndex.value];
    if (item) {
      emit('select-word', item);
      close();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
    @click.self="close"
  >
    <div
      class="w-full max-w-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
    >
      <!-- Search input header -->
      <div class="relative flex items-center px-4 py-3 border-b border-slate-200/80 dark:border-white/10">
        <Search class="h-5 w-5 text-slate-400 shrink-0 mr-3" />
        <input
          ref="inputRef"
          type="text"
          v-model="searchQuery"
          placeholder="Search vocabulary in German, English, Ukrainian..."
          class="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none border-none"
        />
        <button
          type="button"
          @click="close"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close search dialog"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Results list -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <div
          v-if="filteredWords.length === 0"
          class="py-12 text-center text-sm text-slate-400"
        >
          No matching words found for "{{ searchQuery }}"
        </div>

        <div
          v-for="(word, idx) in filteredWords"
          :key="getItemKey(word)"
          @click="emit('select-word', word); close()"
          :class="[
            'p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all',
            idx === selectedIndex
              ? 'bg-primary-500/15 border border-primary-500/30 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
          ]"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span
                class="text-xs font-bold font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                {{ word.level }}
              </span>
              <span
                class="text-sm font-semibold truncate text-slate-900 dark:text-white"
                v-html="sanitizeHtml(word.german)"
              ></span>
              <span class="text-xs text-slate-400 truncate">
                ({{ getThemaLabel(word.thema) }})
              </span>
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span class="font-medium text-primary-600 dark:text-primary-400 mr-2">{{ word.english }}</span>
              <span>{{ word.ukrainian }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0" @click.stop>
            <button
              type="button"
              @click="emit('toggle-mastered', word)"
              :title="masteredIds.has(getItemKey(word)) ? 'Mastered' : 'Mark as mastered'"
              :class="[
                'p-1.5 rounded-lg border transition-all',
                masteredIds.has(getItemKey(word))
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:text-emerald-500'
              ]"
            >
              <Check class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              @click="emit('play-audio', word.german_audio || word.german)"
              title="Pronounce"
              class="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
            >
              <Volume2 class="h-3.5 w-3.5" />
            </button>
            <ArrowRight class="h-3.5 w-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      <!-- Footer info with keyboard hints -->
      <div
        class="px-4 py-2 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <span>Navigate: <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono">↑</kbd> <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono">↓</kbd></span>
          <span>Select: <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono">Enter</kbd></span>
        </div>
        <span>Close: <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono">Esc</kbd></span>
      </div>
    </div>
  </div>
</template>
