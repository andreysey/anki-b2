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

// Level Statistics (B1+ vs B2)
const levelStats = computed(() => {
  const levels = ['B1+', 'B2'];
  return levels.map((lvl) => {
    const words = props.vocabulary.filter((w) => w.level === lvl);
    const total = words.length;
    const mastered = words.filter((w) => props.masteredIds.has(getItemKey(w))).length;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return {
      level: lvl,
      total,
      mastered,
      percentage
    };
  });
});

// Detailed Leitner Box 0-5 Breakdown
const leitnerBoxes = computed(() => {
  const counts = {
    box0: 0, // New / Due
    box1: 0, // 1 Day
    box2: 0, // 3 Days
    box3: 0, // 7 Days
    box4: 0, // 14 Days
    box5: 0 // 30 Days / Mastered
  };

  props.vocabulary.forEach((w) => {
    const key = getItemKey(w);
    if (props.masteredIds.has(key)) {
      counts.box5++;
      return;
    }

    const srs = props.srsData[key];
    if (!srs || srs.level === 0) {
      counts.box0++;
    } else if (srs.level === 1) {
      counts.box1++;
    } else if (srs.level === 2) {
      counts.box2++;
    } else if (srs.level === 3) {
      counts.box3++;
    } else if (srs.level === 4) {
      counts.box4++;
    } else {
      counts.box5++;
    }
  });

  const total = props.vocabulary.length || 1;

  return [
    {
      label: 'Box 0 (New/Due)',
      count: counts.box0,
      percentage: Math.round((counts.box0 / total) * 100)
    },
    {
      label: 'Box 1 (1 Day)',
      count: counts.box1,
      percentage: Math.round((counts.box1 / total) * 100)
    },
    {
      label: 'Box 2 (3 Days)',
      count: counts.box2,
      percentage: Math.round((counts.box2 / total) * 100)
    },
    {
      label: 'Box 3 (7 Days)',
      count: counts.box3,
      percentage: Math.round((counts.box3 / total) * 100)
    },
    {
      label: 'Box 4 (14 Days)',
      count: counts.box4,
      percentage: Math.round((counts.box4 / total) * 100)
    },
    {
      label: 'Box 5 (Mastered)',
      count: counts.box5,
      percentage: Math.round((counts.box5 / total) * 100)
    }
  ];
});

// Category / Thema Detailed Breakdown
const stats = computed(() => {
  const themas = [...new Set(props.vocabulary.map((item) => item.thema))].sort((a, b) => a - b);

  return themas.map((themaNum) => {
    const totalWords = props.vocabulary.filter((item) => item.thema === themaNum);
    const masteredWords = totalWords.filter((item) => props.masteredIds.has(getItemKey(item)));
    const percentage =
      totalWords.length ? Math.round((masteredWords.length / totalWords.length) * 100) : 0;

    return {
      thema: themaNum,
      name: getThemaLabel(themaNum),
      total: totalWords.length,
      mastered: masteredWords.length,
      percentage
    };
  });
});

const totalWords = computed(() => props.vocabulary.length);
const totalMastered = computed(() => {
  let count = 0;
  props.vocabulary.forEach((word) => {
    if (props.masteredIds.has(getItemKey(word))) {
      count++;
    }
  });
  return count;
});

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
