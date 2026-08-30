<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Word, SRSState } from '../types';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Download,
  Upload
} from 'lucide-vue-next';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';
import { downloadBackupFile, parseAndValidateBackup } from '../utils/backup';

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

const fileInputRef = ref<HTMLInputElement | null>(null);
const importError = ref<string | null>(null);
const importSuccess = ref<string | null>(null);

const handleExport = () => {
  downloadBackupFile(props.masteredIds, props.srsData);
};

const triggerFileInput = () => {
  importError.value = null;
  importSuccess.value = null;
  fileInputRef.value?.click();
};

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    const result = parseAndValidateBackup(content);
    if (result.success && result.data) {
      emit('restore-progress', {
        masteredIds: result.data.masteredIds,
        srsData: result.data.srsData
      });
      importSuccess.value = `Successfully restored ${result.data.masteredIds.length} mastered words and ${Object.keys(result.data.srsData).length} SRS cards.`;
      importError.value = null;
    } else {
      importError.value = result.error || 'Failed to import backup file';
      importSuccess.value = null;
    }
  };
  reader.readAsText(file);
  target.value = '';
};

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
      totalWords.length > 0 ? Math.round((masteredWords.length / totalWords.length) * 100) : 0;

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
    <div
      class="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Leitner Box Distribution (SRS Memory Depth)
        </h3>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium"
          >Stages 0 to 5</span
        >
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          v-for="box in leitnerBoxes"
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

    <!-- macOS System Settings Sync & Backup Panel -->
    <div
      class="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4"
    >
      <div
        class="flex justify-between items-center text-xs sm:text-sm font-semibold flex-wrap gap-2"
      >
        <span class="text-slate-800 dark:text-slate-200 font-bold">Overall Course Progress</span>
        <span class="text-primary-600 dark:text-primary-400"
          >{{ totalMastered }} / {{ totalWords }} mastered</span
        >
      </div>
      <Progress :modelValue="totalPercentage" class="h-2.5" />

      <!-- Sync Controls -->
      <div
        class="pt-3.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-3"
      >
        <div class="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          Sync and transfer your learning progress across devices with a JSON backup file.
        </div>
        <div class="flex gap-2.5">
          <input
            type="file"
            ref="fileInputRef"
            accept=".json"
            class="hidden"
            @change="handleFileImport"
          />
          <Button
            variant="outline"
            size="sm"
            @click="handleExport"
            class="rounded-xl text-xs py-1.5 px-3 font-semibold"
          >
            <Download class="h-3.5 w-3.5" />
            <span>Export Backup</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="triggerFileInput"
            class="rounded-xl text-xs py-1.5 px-3 font-semibold"
          >
            <Upload class="h-3.5 w-3.5" />
            <span>Restore Progress</span>
          </Button>
        </div>
      </div>

      <!-- Feedback notifications -->
      <div v-if="importSuccess" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        {{ importSuccess }}
      </div>
      <div v-if="importError" class="text-xs text-red-600 dark:text-red-400 font-medium">
        {{ importError }}
      </div>
    </div>

    <!-- Category / Thema Widgets Grid -->
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
  </div>
</template>
