<script setup lang="ts">
import { Button } from './ui/button';
import { Check, Share2 } from '@lucide/vue';
import type { Word } from '../types';
import { getThemaLabel } from '../utils/thema';
import { toast } from './ui/sonner/toast';

const props = defineProps<{
  word: Word;
}>();

const emit = defineEmits<{
  (e: 'toggle-mastered', word: Word): void;
}>();

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const handleShare = async () => {
  const cleanGerman = props.word.german.replace(/<[^>]*>?/gm, '');
  const shareData = {
    title: `German B2: ${cleanGerman}`,
    text: `${cleanGerman} - ${props.word.english} (${props.word.ukrainian})\n${props.word.example ? `Example: ${props.word.example}` : ''}`,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };

  if (canShare) {
    try {
      await navigator.share(shareData);
    } catch (err: unknown) {
      // User cancelled share or aborted
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  } else if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(shareData.text);
      toast.success('Word copied to clipboard');
    } catch {
      toast.error('Failed to copy word');
    }
  }
};
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
        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200/80 dark:bg-white/10 dark:text-slate-300 dark:border-white/10 shadow-2xs max-w-55 truncate"
        :title="getThemaLabel(word.thema)"
      >
        {{ getThemaLabel(word.thema) }}
      </span>
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Share word"
        @click.stop="handleShare"
        :title="canShare ? 'Share word' : 'Copy word info'"
        class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-full shrink-0 w-8 h-8 cursor-pointer active:scale-95 transition-all"
      >
        <Share2 class="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Mark as Mastered"
        @click.stop="emit('toggle-mastered', word)"
        title="Mark as Mastered"
        class="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 active:scale-95 transition-all rounded-full shrink-0 w-8 h-8 cursor-pointer"
      >
        <Check class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
