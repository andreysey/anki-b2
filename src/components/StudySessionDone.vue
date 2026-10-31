<script setup lang="ts">
import { computed } from 'vue';
import { Button } from './ui/button';
import { CircleCheck, Flame, Plus, Layers, CalendarCheck } from '@lucide/vue';
import type { SessionMode } from '../composables/useStudySession';

const props = defineProps<{
  mode: SessionMode;
  /** Cards graded in this visit */
  reviewedCount: number;
  streak: number;
  /** New cards not studied yet (within the current filters) */
  newLeft: number;
  newPerDay: number;
}>();

const emit = defineEmits<{
  (e: 'add-new'): void;
  (e: 'set-mode', mode: SessionMode): void;
}>();

const title = computed(() =>
  props.mode === 'all' ? 'You went through every card' : 'Done for today'
);
const subtitle = computed(() => {
  if (props.mode === 'all') return 'All cards in the current filters are behind you.';
  if (!props.reviewedCount) return 'Nothing is due right now. Come back later or learn new words.';
  return 'Your reviews for today are finished. Come back tomorrow to keep the streak.';
});
</script>

<template>
  <section
    class="w-full rounded-[26px] border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 shadow-xl px-5 py-8 sm:px-8 sm:py-10 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-300"
    aria-labelledby="session-done-title"
  >
    <div
      class="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
    >
      <CircleCheck class="h-7 w-7" aria-hidden="true" />
    </div>

    <div class="space-y-1.5">
      <h2
        id="session-done-title"
        class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
      >
        {{ title }}
      </h2>
      <p class="text-sm text-slate-600 dark:text-slate-400 max-w-sm">{{ subtitle }}</p>
    </div>

    <div class="flex flex-wrap justify-center gap-2.5 text-xs font-semibold">
      <span
        v-if="reviewedCount"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300"
      >
        <CalendarCheck class="h-3.5 w-3.5" aria-hidden="true" />
        {{ reviewedCount }} {{ reviewedCount === 1 ? 'card' : 'cards' }} reviewed
      </span>
      <span
        v-if="streak"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400"
      >
        <Flame class="h-3.5 w-3.5" aria-hidden="true" />
        {{ streak }}-day streak
      </span>
    </div>

    <div class="flex flex-col xs:flex-row gap-2.5 w-full xs:w-auto">
      <Button
        v-if="newLeft > 0"
        class="rounded-xl gap-2 pointer-coarse:h-11"
        @click="emit('add-new')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        {{ Math.min(newPerDay, newLeft) }} more new {{ newLeft === 1 ? 'word' : 'words' }}
      </Button>
      <Button
        v-if="mode === 'daily'"
        variant="outline"
        class="rounded-xl gap-2 pointer-coarse:h-11"
        @click="emit('set-mode', 'all')"
      >
        <Layers class="h-4 w-4" aria-hidden="true" />
        Keep studying everything
      </Button>
      <Button
        v-else
        variant="outline"
        class="rounded-xl gap-2 pointer-coarse:h-11"
        @click="emit('set-mode', 'daily')"
      >
        <CalendarCheck class="h-4 w-4" aria-hidden="true" />
        Back to today's session
      </Button>
    </div>
  </section>
</template>
