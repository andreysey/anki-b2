<script setup lang="ts">
import Card from 'primevue/card';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import type { Word } from '../types';
import { sanitizeHtml } from '../utils/sanitize';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';

defineProps<{
  vocabulary: Word[];
  displayLimit: number;
}>();

const emit = defineEmits<{
  (e: 'load-more'): void;
  (e: 'play-audio', text: string): void;
  (e: 'toggle-mastered', word: Word): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-10 sm:gap-14 animate-in fade-in duration-500">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      <Card 
        v-for="item in vocabulary.slice(0, displayLimit)" 
        :key="getItemKey(item)" 
        class="border border-white/10 dark:border-white/10 rounded-2xl overflow-hidden hover:scale-[1.01] transition-all duration-300"
      >
        <template #header>
          <div class="flex justify-between items-center w-full">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
              {{ item.level }}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-800/60 dark:bg-white/10 text-surface-400 dark:text-surface-300 border border-surface-700/60 dark:border-white/10 max-w-[170px] truncate" :title="getThemaLabel(item.thema)">
              {{ getThemaLabel(item.thema) }}
            </span>
          </div>
        </template>
        <template #content>
          <div class="flex justify-between items-start mb-3 gap-3">
            <div class="text-lg font-bold text-surface-900 dark:text-white leading-snug select-text" v-html="sanitizeHtml(item.german)"></div>
            <div class="flex items-center gap-1 shrink-0">
              <Button 
                icon="pi pi-check" 
                rounded 
                text 
                severity="success" 
                size="small"
                @click.stop="emit('toggle-mastered', item)" 
                title="Mark as Mastered"
                class="hover:bg-green-500/15"
              />
              <Button 
                icon="pi pi-volume-up" 
                rounded 
                text 
                size="small"
                @click.stop="emit('play-audio', item.german_audio || item.german)" 
                title="Play pronunciation"
                class="hover:bg-primary-500/15"
              />
            </div>
          </div>
          <div class="space-y-1 mb-3 text-xs sm:text-sm">
            <div class="text-primary-400 font-semibold select-text">{{ item.english }}</div>
            <div class="text-surface-600 dark:text-surface-300 font-medium select-text">{{ item.ukrainian }}</div>
          </div>
          <template v-if="item.example">
            <Divider class="!my-2.5" />
            <div class="flex items-center justify-between gap-2">
              <div class="italic text-surface-500 dark:text-surface-400 text-xs leading-relaxed [&_strong]:text-primary-400 [&_b]:text-primary-400 select-text" v-html="sanitizeHtml(item.example)"></div>
              <Button 
                icon="pi pi-volume-up" 
                rounded 
                text 
                severity="secondary"
                size="small"
                class="shrink-0 hover:bg-white/10"
                @click.stop="emit('play-audio', item.example)" 
                title="Play example"
              />
            </div>
          </template>
        </template>
      </Card>
    </div>

    <!-- Explore More Vocabulary Button -->
    <div v-if="displayLimit < vocabulary.length" class="flex justify-center pb-12">
      <Button 
        label="Explore More Vocabulary" 
        icon="pi pi-chevron-down"
        size="small"
        @click="emit('load-more')"
        outlined
        class="!rounded-full px-6 py-2 shadow-xs active:scale-95 transition-all text-xs font-semibold"
      />
    </div>
  </div>
</template>
