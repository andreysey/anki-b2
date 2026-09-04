<script setup lang="ts">
import { Progress } from './ui/progress';

export interface LeitnerBoxStat {
  label: string;
  count: number;
  percentage: number;
}

defineProps<{
  boxes: LeitnerBoxStat[];
}>();
</script>

<template>
  <div
    class="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
        Leitner Box Distribution (SRS Memory Depth)
      </h3>
      <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Stages 0 to 5</span>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div
        v-for="box in boxes"
        :key="box.label"
        class="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 space-y-1.5"
      >
        <div
          class="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate"
          :title="box.label"
        >
          {{ box.label }}
        </div>
        <div class="text-xl font-black text-slate-900 dark:text-white">
          {{ box.count }}
        </div>
        <Progress :modelValue="box.percentage" class="h-1" />
      </div>
    </div>
  </div>
</template>
