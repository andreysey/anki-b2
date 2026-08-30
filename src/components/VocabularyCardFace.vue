<script setup lang="ts">
import { ref } from 'vue';
import type { Word } from '../types';
import { Button } from './ui/button';
import { Volume2 } from 'lucide-vue-next';
import { sanitizeHtml } from '../utils/sanitize';
import VocabularyCardHeader from './VocabularyCardHeader.vue';
import AIAssistant from './AIAssistant.vue';

defineProps<{
  word: Word;
  showGerman: boolean;
  showExample?: boolean;
  showAi?: boolean;
  scrollPanelHeight?: string;
}>();

const emit = defineEmits<{
  (e: 'toggle-mastered', word: Word): void;
  (e: 'play-audio', text: string): void;
  (e: 'ai-active', isActive: boolean): void;
}>();

const isAiContentActive = ref(false);

const handleAiActive = (active: boolean) => {
  isAiContentActive.value = active;
  emit('ai-active', active);
};
</script>

<template>
  <div
    class="w-full h-full bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[26px] overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-2xl flex flex-col p-5 sm:p-6 transition-all duration-300"
  >
    <!-- Card Header -->
    <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />

    <!-- Card Body & Content -->
    <div class="flex-1 flex flex-col justify-center overflow-hidden pt-2">
      <div
        :class="[
          'custom-scrollbar overflow-y-auto px-1 transition-all duration-300',
          isAiContentActive
            ? 'h-107.5 sm:h-125'
            : scrollPanelHeight || 'h-62.5 sm:h-70'
        ]"
      >
        <!-- German Primary View -->
        <template v-if="showGerman">
          <div class="flex flex-col items-center justify-center gap-4 py-4 sm:py-6 my-auto">
            <h2
              class="text-2xl sm:text-3xl font-extrabold text-center tracking-tight text-slate-900 dark:text-white leading-snug select-text"
              v-html="sanitizeHtml(word.german)"
            ></h2>
            <Button
              variant="default"
              size="icon"
              aria-label="Play German pronunciation"
              @click.stop="emit('play-audio', word.german_audio || word.german)"
              title="Play pronunciation"
              class="rounded-full w-10 h-10 shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <Volume2 class="h-4 w-4" />
            </Button>
          </div>
        </template>

        <!-- Translation Primary View -->
        <template v-else>
          <div class="flex flex-col items-center justify-center gap-1.5 py-3">
            <div
              class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight select-text"
            >
              {{ word.ukrainian }}
            </div>
            <div
              class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium select-text"
            >
              {{ word.english }}
            </div>
          </div>
        </template>

        <!-- Context Example Sentence -->
        <template v-if="showExample && word.example">
          <div
            class="my-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center justify-between gap-3"
          >
            <div
              class="text-xs sm:text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed [&_strong]:text-primary-600 [&_strong]:dark:text-primary-400 [&_strong]:font-bold [&_b]:text-primary-600 [&_b]:dark:text-primary-400 select-text"
              v-html="sanitizeHtml(word.example)"
            ></div>
            <Button
              variant="ghost"
              size="icon-sm"
              class="shrink-0 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-full w-8 h-8"
              aria-label="Play example sentence pronunciation"
              @click.stop="emit('play-audio', word.example)"
              title="Play example sentence"
            >
              <Volume2 class="h-3.5 w-3.5" />
            </Button>
          </div>
        </template>

        <!-- AI Assistant -->
        <AIAssistant v-if="showAi" :word="word" @ai-active="handleAiActive" />
      </div>
    </div>
  </div>
</template>
