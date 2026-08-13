<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import type { Word } from '../types';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
import { sanitizeHtml } from '../utils/sanitize';
import VocabularyCardHeader from './VocabularyCardHeader.vue';

const AIAssistant = defineAsyncComponent(() => import('./AIAssistant.vue'));

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
  <Card class="w-full h-full">
    <template #header>
      <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />
    </template>
    <template #content>
      <ScrollPanel :class="scrollPanelHeight || 'h-[280px]'">
        <!-- German Primary View -->
        <template v-if="showGerman">
          <div class="flex flex-col items-center gap-6 py-4">
            <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="sanitizeHtml(word.german)"></h2>
            <Button 
              icon="pi pi-volume-up"
              rounded
              aria-label="Play German pronunciation"
              @click.stop="emit('play-audio', word.german_audio)" 
              title="Play pronunciation"
            />
          </div>
        </template>

        <!-- Translation Primary View -->
        <template v-else>
          <div class="flex flex-col items-center gap-4 py-4">
            <div class="text-2xl sm:text-3xl font-bold">{{ word.ukrainian }}</div>
            <div class="text-lg text-surface-400">{{ word.english }}</div>
          </div>
        </template>

        <!-- Optional Context Example Sentence -->
        <template v-if="showExample && word.example">
          <Divider />
          <div class="flex items-center justify-center gap-2">
            <div class="italic text-surface-300 text-center [&_strong]:text-primary [&_b]:text-primary" v-html="sanitizeHtml(word.example)"></div>
            <Button 
              icon="pi pi-volume-up"
              rounded
              text
              severity="secondary"
              size="small"
              class="shrink-0"
              aria-label="Play example sentence pronunciation"
              @click.stop="emit('play-audio', word.example)" 
              title="Play example sentence"
            />
          </div>
        </template>

        <!-- Optional AI Assistant -->
        <AIAssistant v-if="showAi" :word="word" />
      </ScrollPanel>
    </template>
  </Card>
</template>
