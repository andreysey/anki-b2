<script setup lang="ts">
import type { Word } from '../types';
import Card from 'primevue/card';
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
  <Card class="w-full h-full border border-white/10 dark:border-white/10 rounded-[28px] overflow-hidden shadow-2xl">
    <template #header>
      <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />
    </template>
    <template #content>
      <ScrollPanel :class="scrollPanelHeight || 'h-[280px]'" class="custom-scrollbar px-2">
        <!-- German Primary View -->
        <template v-if="showGerman">
          <div class="flex flex-col items-center justify-center gap-5 py-6">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-surface-900 dark:text-white leading-snug select-text" v-html="sanitizeHtml(word.german)"></h2>
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
            <div class="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight select-text">{{ word.ukrainian }}</div>
            <div class="text-base text-surface-500 dark:text-surface-400 font-medium select-text">{{ word.english }}</div>
          </div>
        </template>

        <!-- Context Example Sentence -->
        <template v-if="showExample && word.example">
          <div class="my-3 p-3.5 rounded-2xl bg-surface-900/40 dark:bg-white/5 border border-surface-800/60 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
            <div class="text-sm italic text-surface-600 dark:text-surface-300 leading-relaxed [&_strong]:text-primary-400 [&_strong]:font-bold [&_b]:text-primary-400 select-text" v-html="sanitizeHtml(word.example)"></div>
            <Button 
              icon="pi pi-volume-up"
              rounded
              text
              severity="secondary"
              size="small"
              class="shrink-0 hover:bg-white/10"
              aria-label="Play example sentence pronunciation"
              @click.stop="emit('play-audio', word.example)" 
              title="Play example sentence"
            />
          </div>
        </template>

        <!-- AI Assistant -->
        <AIAssistant v-if="showAi" :word="word" />
      </ScrollPanel>
    </template>
  </Card>
</template>
