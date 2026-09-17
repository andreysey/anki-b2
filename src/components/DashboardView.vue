<script setup lang="ts">
import { computed } from 'vue';
import type { Word, SRSState } from '../types';
import { Progress } from './ui/progress';
import { TrendingUp } from 'lucide-vue-next';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';
import DashboardThemaBreakdown from './DashboardThemaBreakdown.vue';
import DashboardSummaryCards from './DashboardSummaryCards.vue';
import DashboardLeitnerBoxes from './DashboardLeitnerBoxes.vue';
import DashboardBackupSync from './DashboardBackupSync.vue';

const props = withDefaults(
  defineProps<{
    vocabulary: Word[];
    masteredIds: Set<string>;
    srsData?: Record<string, SRSState>;
    studyStreak?: { lastDate: string; streak: number };
  }>(),
  {
    srsData: () => ({}),
    studyStreak: () => ({ lastDate: '', streak: 0 })
  }
);

const emit = defineEmits<{
  (
    e: 'restore-progress',
    payload: { masteredIds: string[]; srsData: Record<string, SRSState> }
  ): void;
}>();

// Aggregated Telemetry Data in a single unified pass over vocabulary
const aggregatedMetrics = computed(() => {
  const levels = {
    'B1+': { total: 0, mastered: 0 },
    'B2': { total: 0, mastered: 0 }
  };

  const leitnerCounts = {
    box0: 0,
    box1: 0,
    box2: 0,
    box3: 0,
    box4: 0,
    box5: 0
  };

  const themaMap = new Map<number, { total: number; mastered: number }>();
  let masteredCount = 0;

  props.vocabulary.forEach((w) => {
    const key = getItemKey(w);
    const isMastered = props.masteredIds.has(key);

    if (isMastered) {
      masteredCount++;
    }

    // Level breakdown
    if (w.level === 'B1+') {
      levels['B1+'].total++;
      if (isMastered) levels['B1+'].mastered++;
    } else if (w.level === 'B2') {
      levels['B2'].total++;
      if (isMastered) levels['B2'].mastered++;
    }

    // Leitner boxes
    if (isMastered) {
      leitnerCounts.box5++;
    } else {
      const srs = props.srsData[key];
      if (!srs || srs.level === 0) {
        leitnerCounts.box0++;
      } else if (srs.level === 1) {
        leitnerCounts.box1++;
      } else if (srs.level === 2) {
        leitnerCounts.box2++;
      } else if (srs.level === 3) {
        leitnerCounts.box3++;
      } else if (srs.level === 4) {
        leitnerCounts.box4++;
      } else {
        leitnerCounts.box5++;
      }
    }

    // Thema breakdown
    let entry = themaMap.get(w.thema);
    if (!entry) {
      entry = { total: 0, mastered: 0 };
      themaMap.set(w.thema, entry);
    }
    entry.total++;
    if (isMastered) {
      entry.mastered++;
    }
  });

  return {
    levels,
    leitnerCounts,
    themaMap,
    masteredCount
  };
});

// Level Statistics (B1+ vs B2)
const levelStats = computed(() => {
  const { levels } = aggregatedMetrics.value;
  return (['B1+', 'B2'] as const).map((lvl) => {
    const data = levels[lvl];
    const percentage = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
    return {
      level: lvl,
      total: data.total,
      mastered: data.mastered,
      percentage
    };
  });
});

// Detailed Leitner Box 0-5 Breakdown
const leitnerBoxes = computed(() => {
  const { leitnerCounts } = aggregatedMetrics.value;
  const total = props.vocabulary.length || 1;

  return [
    {
      label: 'Box 0 (New/Due)',
      count: leitnerCounts.box0,
      percentage: Math.round((leitnerCounts.box0 / total) * 100)
    },
    {
      label: 'Box 1 (1 Day)',
      count: leitnerCounts.box1,
      percentage: Math.round((leitnerCounts.box1 / total) * 100)
    },
    {
      label: 'Box 2 (3 Days)',
      count: leitnerCounts.box2,
      percentage: Math.round((leitnerCounts.box2 / total) * 100)
    },
    {
      label: 'Box 3 (7 Days)',
      count: leitnerCounts.box3,
      percentage: Math.round((leitnerCounts.box3 / total) * 100)
    },
    {
      label: 'Box 4 (14 Days)',
      count: leitnerCounts.box4,
      percentage: Math.round((leitnerCounts.box4 / total) * 100)
    },
    {
      label: 'Box 5 (Mastered)',
      count: leitnerCounts.box5,
      percentage: Math.round((leitnerCounts.box5 / total) * 100)
    }
  ];
});

// Category / Thema Detailed Breakdown
const stats = computed(() => {
  const { themaMap } = aggregatedMetrics.value;

  return Array.from(themaMap.keys())
    .sort((a, b) => a - b)
    .map((themaNum) => {
      const entry = themaMap.get(themaNum)!;
      const percentage = entry.total > 0 ? Math.round((entry.mastered / entry.total) * 100) : 0;

      return {
        thema: themaNum,
        name: getThemaLabel(themaNum),
        total: entry.total,
        mastered: entry.mastered,
        percentage
      };
    });
});

const totalWords = computed(() => props.vocabulary.length);
const totalMastered = computed(() => aggregatedMetrics.value.masteredCount);

const totalPercentage = computed(() => {
  if (totalWords.value === 0) return 0;
  return Math.round((totalMastered.value / totalWords.value) * 100);
});
</script>

<template>
  <div class="space-y-6 pt-0 animate-in fade-in duration-500">
    <!-- macOS Dashboard Header Title -->
    <div
      class="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10"
    >
      <div class="space-y-0.5">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Activity & Analytics
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Mastery telemetry and spaced repetition retention metrics
        </p>
      </div>
      <div
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-600 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20 shadow-2xs"
      >
        <TrendingUp class="h-3.5 w-3.5" />
        <span>Live Progress</span>
      </div>
    </div>

    <!-- macOS Widget Summary Grid (4 Cards: Total, Mastered, Streak, Progress) -->
    <DashboardSummaryCards
      :totalWords="totalWords"
      :totalMastered="totalMastered"
      :totalPercentage="totalPercentage"
      :studyStreak="studyStreak"
    />

    <!-- Level Progress Widgets (B1+ vs B2) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      <div
        v-for="lvl in levelStats"
        :key="lvl.level"
        class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3"
      >
        <div class="flex justify-between items-center text-xs sm:text-sm font-bold">
          <span class="text-slate-800 dark:text-slate-200">Level {{ lvl.level }} Progress</span>
          <span class="text-primary-600 dark:text-primary-400"
            >{{ lvl.mastered }} / {{ lvl.total }} ({{ lvl.percentage }}%)</span
          >
        </div>
        <Progress :modelValue="lvl.percentage" class="h-2" />
      </div>
    </div>

    <!-- Detailed Leitner Box 0-5 Distribution -->
    <DashboardLeitnerBoxes :boxes="leitnerBoxes" />

    <!-- macOS System Settings Sync & Backup Panel -->
    <DashboardBackupSync
      :totalWords="totalWords"
      :totalMastered="totalMastered"
      :totalPercentage="totalPercentage"
      :masteredIds="masteredIds"
      :srsData="srsData"
      @restore-progress="emit('restore-progress', $event)"
    />

    <!-- Category / Thema Widgets Grid -->
    <DashboardThemaBreakdown :stats="stats" />
  </div>
</template>
