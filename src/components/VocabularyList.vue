<script setup lang="ts">
import { Button } from './ui/button';
import { Check, Volume2, ChevronDown, Copy } from '@lucide/vue';
import type { Word } from '../types';
import { sanitizeHtml } from '../utils/sanitize';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';
import { toast } from './ui/sonner/toast';

defineProps<{
  vocabulary: Word[];
  displayLimit: number;
}>();

const emit = defineEmits<{
  (e: 'load-more'): void;
  (e: 'play-audio', text: string): void;
  (e: 'toggle-mastered', word: Word): void;
}>();

const handleCopy = async (item: Word) => {
  const cleanGerman = item.german.replace(/<[^>]*>?/gm, '');
  const text = `${cleanGerman} - ${item.english} (${item.ukrainian || ''})${item.example ? `\nExample: ${item.example.replace(/<[^>]*>?/gm, '')}` : ''}`;
  if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 sm:gap-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 vocab-list-grid">
      <div
        v-for="(item, idx) in vocabulary.slice(0, displayLimit)"
        :key="getItemKey(item)"
        :class="[
          '@container bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 rounded-2xl p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-white/20 hover:scale-[1.01] transition-all duration-200 flex flex-col',
          idx >= 6 ? 'vocab-card-auto' : ''
        ]"
      >
        <!-- Header -->
        <div class="flex justify-between items-center w-full gap-2 mb-2.5">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25 shrink-0"
            >
              {{ item.level }}
            </span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200/80 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 max-w-32 sm:max-w-40 truncate"
              :title="getThemaLabel(item.thema)"
            >
              {{ getThemaLabel(item.thema) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              @click.stop="emit('toggle-mastered', item)"
              title="Mark as Mastered"
              class="rounded-full w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              @click.stop="handleCopy(item)"
              title="Copy word to clipboard"
              class="rounded-full w-7 h-7 sm:w-8 sm:h-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <Copy class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              @click.stop="emit('play-audio', item.german_audio || item.german)"
              title="Play pronunciation"
              class="rounded-full w-7 h-7 sm:w-8 sm:h-8 text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 hover:scale-105 border border-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex flex-col flex-1 gap-2.5 min-w-0">
          <div
            class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug select-text break-words hyphens-auto"
            lang="de"
            v-html="sanitizeHtml(item.german)"
          ></div>
          <div class="space-y-0.5 text-xs sm:text-sm">
            <div class="text-primary-600 dark:text-primary-400 font-semibold select-text text-balance">
              {{ item.english }}
            </div>
            <div class="text-slate-600 dark:text-slate-300 font-medium select-text text-balance">
              {{ item.ukrainian }}
            </div>
          </div>
          <template v-if="item.example">
            <div class="mt-auto pt-2">
              <div class="h-px bg-slate-200/80 dark:bg-slate-800 mb-2.5"></div>
              <div
                class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
              >
                <div
                  class="italic text-slate-700 dark:text-slate-400 text-[11px] leading-relaxed [&_strong]:text-primary-600 [&_strong]:dark:text-primary-400 [&_b]:text-primary-600 [&_b]:dark:text-primary-400 select-text text-pretty"
                  v-html="sanitizeHtml(item.example)"
                ></div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  class="shrink-0 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 w-6 h-6 rounded-full"
                  @click.stop="emit('play-audio', item.example)"
                  title="Play example"
                >
                  <Volume2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Explore More Vocabulary Button -->
    <div v-if="displayLimit < vocabulary.length" class="flex justify-center pb-4">
      <Button
        variant="outline"
        size="sm"
        @click="emit('load-more')"
        class="rounded-full px-5 py-2 shadow-xs active:scale-95 transition-all text-xs font-semibold"
      >
        <ChevronDown class="h-3.5 w-3.5" />
        <span>Explore More Vocabulary</span>
      </Button>
    </div>
  </div>
</template>
