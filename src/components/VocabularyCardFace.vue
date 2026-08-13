<script setup lang="ts">
import type { Word } from '../types';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
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
}>();
</script>

<template>
  <div class="w-full h-full bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-[28px] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl flex flex-col p-6 sm:p-7">
    <!-- Card Header -->
    <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />

    <!-- Card Body & Content -->
    <div class="flex-1 flex flex-col justify-center overflow-hidden pt-3">
      <ScrollPanel :class="scrollPanelHeight || 'h-[280px]'" class="custom-scrollbar px-1">
        <!-- German Primary View -->
        <template v-if="showGerman">
          <div class="flex flex-col items-center justify-center gap-6 py-6 sm:py-8 my-auto">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-slate-900 dark:text-white leading-snug select-text" v-html="sanitizeHtml(word.german)"></h2>
            <Button 
              icon="pi pi-volume-up"
              rounded
              aria-label="Play German pronunciation"
              @click.stop="emit('play-audio', word.german_audio || word.german)" 
              title="Play pronunciation"
              class="w-12 h-12 shadow-md hover:scale-105 active:scale-95 transition-all bg-primary-500 hover:bg-primary-600 text-white"
            />
          </div>
        </template>

        <!-- Translation Primary View -->
        <template v-else>
          <div class="flex flex-col items-center justify-center gap-2 py-4">
            <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight select-text">{{ word.ukrainian }}</div>
            <div class="text-base text-slate-600 dark:text-slate-400 font-medium select-text">{{ word.english }}</div>
          </div>
        </template>

        <!-- Context Example Sentence -->
        <template v-if="showExample && word.example">
          <div class="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs flex items-center justify-between gap-3">
            <div class="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed [&_strong]:text-primary-600 [&_strong]:dark:text-primary-400 [&_strong]:font-bold [&_b]:text-primary-600 [&_b]:dark:text-primary-400 select-text" v-html="sanitizeHtml(word.example)"></div>
            <Button 
              icon="pi pi-volume-up" 
              rounded 
              text 
              severity="secondary"
              size="small"
              class="shrink-0 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              aria-label="Play example sentence pronunciation"
              @click.stop="emit('play-audio', word.example)" 
              title="Play example sentence"
            />
          </div>
        </template>

        <!-- AI Assistant -->
        <AIAssistant v-if="showAi" :word="word" />
      </ScrollPanel>
    </div>
  </div>
</template>
