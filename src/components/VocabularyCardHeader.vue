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
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25 shadow-2xs"
      >
        {{ word.level }}
      </span>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200/80 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 shadow-2xs max-w-[220px] truncate"
        :title="getThemaLabel(word.thema)"
      >
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
