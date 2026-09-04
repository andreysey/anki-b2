<script setup lang="ts">
import { Progress } from './ui/progress';

export interface ThemaStat {
  thema: number;
  name: string;
  total: number;
  mastered: number;
  percentage: number;
}

defineProps<{
  stats: ThemaStat[];
}>();
</script>

<template>
  <div
    class="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4"
  >
    <div
      class="flex justify-between items-center border-b border-slate-200/80 dark:border-white/10 pb-3"
    >
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">
        Progress by Topic & Category
      </h3>
      <span class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold"
        >{{ stats.length }} Topics Total</span
      >
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <div
        v-for="item in stats"
        :key="item.thema"
        class="space-y-2 p-3 bg-slate-50/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 rounded-xl hover:border-primary-500/40 transition-all duration-200"
      >
        <div class="flex justify-between items-start gap-2">
          <span
            class="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1"
            :title="item.name"
            >{{ item.name }}</span
          >
          <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0"
            >{{ item.mastered }}/{{ item.total }} ({{ item.percentage }}%)</span
          >
        </div>
        <Progress :modelValue="item.percentage" class="h-1.5" />
      </div>
    </div>
  </div>
</template>
