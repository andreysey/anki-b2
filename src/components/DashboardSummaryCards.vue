<script setup lang="ts">
import { BookOpen, CheckCircle2, TrendingUp } from 'lucide-vue-next';

defineProps<{
  totalWords: number;
  totalMastered: number;
  totalPercentage: number;
  studyStreak?: { lastDate: string; streak: number };
}>();
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
    <!-- Total Vocabulary -->
    <div
      class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Total Vocabulary
        </span>
        <div
          class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center"
        >
          <BookOpen class="h-3.5 w-3.5" />
        </div>
      </div>
      <div
        class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
      >
        {{ totalWords }}
      </div>
      <div class="text-[11px] text-slate-500 dark:text-slate-400">Full professional corpus</div>
    </div>

    <!-- Mastered Count -->
    <div
      class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Words Mastered
        </span>
        <div
          class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center"
        >
          <CheckCircle2 class="h-3.5 w-3.5" />
        </div>
      </div>
      <div
        class="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight"
      >
        {{ totalMastered }}
      </div>
      <div class="text-[11px] text-slate-500 dark:text-slate-400">Marked as fully memorized</div>
    </div>

    <!-- Daily Streak -->
    <div
      class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Daily Streak
        </span>
        <div
          class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center text-sm"
        >
          🔥
        </div>
      </div>
      <div
        class="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight flex items-baseline gap-1.5"
      >
        <span>{{ studyStreak?.streak || 0 }}</span>
        <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">days</span>
      </div>
      <div class="text-[11px] text-slate-500 dark:text-slate-400">Consecutive study days</div>
    </div>

    <!-- Overall Progress -->
    <div
      class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          Overall Progress
        </span>
        <div
          class="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 flex items-center justify-center"
        >
          <TrendingUp class="h-3.5 w-3.5" />
        </div>
      </div>
      <div
        class="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight"
      >
        {{ totalPercentage }}%
      </div>
      <div class="text-[11px] text-slate-500 dark:text-slate-400">
        {{ totalMastered }} of {{ totalWords }} completed
      </div>
    </div>
  </div>
</template>
