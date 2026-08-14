<script setup lang="ts">
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
  <div class="flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <div
        v-for="item in vocabulary.slice(0, displayLimit)"
        :key="getItemKey(item)"
        class="bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between"
      >
        <!-- Header -->
        <div class="flex justify-between items-center w-full mb-2.5">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25"
          >
            {{ item.level }}
          </span>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200/80 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 max-w-[170px] truncate"
            :title="getThemaLabel(item.thema)"
          >
            {{ getThemaLabel(item.thema) }}
          </span>
        </div>

        <!-- Content -->
        <div class="space-y-2.5">
          <div class="flex justify-between items-start gap-2.5">
            <div
              class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug select-text"
              v-html="sanitizeHtml(item.german)"
            ></div>
            <div class="flex items-center gap-1 shrink-0">
              <Button
                icon="pi pi-check"
                rounded
                text
                severity="success"
                size="small"
                @click.stop="emit('toggle-mastered', item)"
                title="Mark as Mastered"
                class="hover:bg-green-500/15 !w-7 !h-7"
              />
              <Button
                icon="pi pi-volume-up"
                rounded
                text
                size="small"
                @click.stop="emit('play-audio', item.german_audio || item.german)"
                title="Play pronunciation"
                class="hover:bg-primary-500/15 text-primary-600 dark:text-primary-400 !w-7 !h-7"
              />
            </div>
          </div>
          <div class="space-y-0.5 text-xs sm:text-sm">
            <div class="text-primary-600 dark:text-primary-400 font-semibold select-text">
              {{ item.english }}
            </div>
            <div class="text-slate-600 dark:text-slate-300 font-medium select-text">
              {{ item.ukrainian }}
            </div>
          </div>
          <template v-if="item.example">
            <Divider class="!my-2" />
            <div
              class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
            >
              <div
                class="italic text-slate-700 dark:text-slate-400 text-[11px] leading-relaxed [&_strong]:text-primary-600 [&_strong]:dark:text-primary-400 [&_b]:text-primary-600 [&_b]:dark:text-primary-400 select-text"
                v-html="sanitizeHtml(item.example)"
              ></div>
              <Button
                icon="pi pi-volume-up"
                rounded
                text
                severity="secondary"
                size="small"
                class="shrink-0 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 !w-6 !h-6"
                @click.stop="emit('play-audio', item.example)"
                title="Play example"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Explore More Vocabulary Button -->
    <div v-if="displayLimit < vocabulary.length" class="flex justify-center pb-4">
      <Button
        label="Explore More Vocabulary"
        icon="pi pi-chevron-down"
        size="small"
        @click="emit('load-more')"
        outlined
        class="!rounded-full px-5 py-2 shadow-xs active:scale-95 transition-all text-xs font-semibold"
      />
    </div>
  </div>
</template>
