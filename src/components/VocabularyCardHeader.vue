<script setup lang="ts">
import Button from 'primevue/button';
import type { Word } from '../types';
import { getThemaLabel } from '../utils/thema';

defineProps<{
  word: Word;
}>();

const emit = defineEmits<{
  (e: 'toggle-mastered', word: Word): void;
}>();
</script>

<template>
  <div class="flex justify-between items-center w-full">
    <div class="flex items-center gap-2 flex-wrap">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-xs">
        {{ word.level }}
      </span>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface-800/60 dark:bg-white/10 text-surface-400 dark:text-surface-300 border border-surface-700/60 dark:border-white/10 shadow-xs max-w-[220px] truncate" :title="getThemaLabel(word.thema)">
        {{ getThemaLabel(word.thema) }}
      </span>
    </div>
    <Button 
      icon="pi pi-check" 
      rounded 
      text 
      severity="success"
      size="small"
      aria-label="Mark as Mastered"
      @click.stop="emit('toggle-mastered', word)" 
      title="Mark as Mastered"
      class="hover:bg-green-500/15 active:scale-95 transition-transform shrink-0"
    />
  </div>
</template>
