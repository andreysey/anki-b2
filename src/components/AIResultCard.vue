<script setup lang="ts">
import { Button } from './ui/button';
import { Sparkles, Copy, Check } from 'lucide-vue-next';
import { sanitizeHtml } from '../utils/sanitize';

defineProps<{
  isLoading: boolean;
  resultText: string;
  isError: boolean;
  isCopied: boolean;
  isModelLoading: boolean;
  loadingStatusText: string;
  modelLoadingProgress: number;
  isGenerating: boolean;
  resultSource: 'nano' | 'webllm' | 'cloud' | 'none';
  displayModelLabel: string;
  displaySourceLabel: string;
}>();

const emit = defineEmits<{
  (e: 'copy'): void;
}>();
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="relative mt-2 p-3.5 rounded-2xl text-left flex flex-col transition-all border shadow-inner"
    :class="
      isError
        ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
        : 'bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
    "
  >
    <!-- Quick Utility Action: Copy to Clipboard -->
    <div v-if="!isLoading && resultText" class="flex items-center justify-end gap-1 mb-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        @click.stop="emit('copy')"
        :title="isCopied ? 'Copied!' : 'Copy text to clipboard'"
        aria-label="Copy text to clipboard"
        :class="isCopied ? 'text-emerald-500 font-bold' : 'text-slate-600 dark:text-slate-300'"
      >
        <component :is="isCopied ? Check : Copy" class="h-3.5 w-3.5" />
      </Button>
    </div>

    <!-- Loading indicator & Real-time Thinking Status -->
    <div v-if="isLoading && !resultText" class="flex flex-col items-center justify-center py-6 gap-2.5 flex-1">
      <Sparkles class="h-5 w-5 text-primary-500 animate-spin" />
      <span class="text-xs text-slate-600 dark:text-slate-300 font-medium animate-pulse">
        {{ loadingStatusText }}
      </span>
      <div v-if="isModelLoading" class="w-48 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
        <div
          class="bg-primary-500 h-full transition-all duration-300 rounded-full"
          :style="{ width: `${modelLoadingProgress}%` }"
        ></div>
      </div>
    </div>

    <!-- Output Text (Live Streaming tokens & completed response) -->
    <div v-else class="text-xs leading-relaxed font-sans pr-1">
      <div
        class="whitespace-pre-wrap select-text font-normal text-slate-800 dark:text-slate-200"
        v-html="sanitizeHtml(resultText)"
      ></div>
      <span
        v-if="isLoading && isGenerating"
        class="inline-block w-1.5 h-3.5 ml-1 bg-primary-500 animate-pulse align-middle rounded-xs"
      ></span>
    </div>

    <!-- Footer with Model Badge & Source Details -->
    <div
      v-if="!isLoading && resultSource !== 'none'"
      class="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400"
    >
      <div
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9.5px] font-semibold bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200"
      >
        <Sparkles class="h-2.5 w-2.5 text-primary-500" />
        <span>{{ displayModelLabel }}</span>
      </div>
      <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
        {{ displaySourceLabel }}
      </span>
    </div>
  </div>
</template>
