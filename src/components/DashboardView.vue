<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Word, SRSState } from '../types';
import ProgressBar from 'primevue/progressbar';
import Button from 'primevue/button';
import { getThemaLabel } from '../utils/thema';
import { getItemKey } from '../composables/useVocabulary';
import { downloadBackupFile, parseAndValidateBackup } from '../utils/backup';

const props = withDefaults(
  defineProps<{
    vocabulary: Word[];
    masteredIds: Set<string>;
    srsData?: Record<string, SRSState>;
  }>(),
  {
    srsData: () => ({})
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

// SRS Stage Distribution
const srsStages = computed(() => {
  let newCount = 0;
  let learningCount = 0; // Level 1-2
  let reviewCount = 0; // Level 3-4
  let masteredCount = 0; // Level 5 or in masteredIds

  props.vocabulary.forEach((w) => {
    const key = getItemKey(w);
    if (props.masteredIds.has(key)) {
      masteredCount++;
      return;
    }

    const srs = props.srsData?.[key];
    const level = srs?.level ?? 0;

    if (level === 0) {
      newCount++;
    } else if (level <= 2) {
      learningCount++;
    } else if (level <= 4) {
      reviewCount++;
    } else {
      masteredCount++;
    }
  });

  return {
    newCount,
    learningCount,
    reviewCount,
    masteredCount
  };
});

// Grouping by Thema
const stats = computed(() => {
  if (props.vocabulary.length === 0) return [];

  const themesMap = new Map<number, { total: number; mastered: number }>();

  props.vocabulary.forEach((word) => {
    const key = word.thema;
    if (!themesMap.has(key)) {
      themesMap.set(key, { total: 0, mastered: 0 });
    }
    const themeStat = themesMap.get(key)!;
    themeStat.total++;

    const wordKey = getItemKey(word);
    if (props.masteredIds.has(wordKey)) {
      themeStat.mastered++;
    }
  });

  return Array.from(themesMap.entries())
    .map(([thema, item]) => {
      const name = getThemaLabel(thema);
      const percentage = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;

      return {
        thema,
        name,
        total: item.total,
        mastered: item.mastered,
        percentage
      };
    })
    .sort((a, b) => a.thema - b.thema);
});

const totalMastered = computed(() => props.masteredIds.size);
const totalWords = computed(() => props.vocabulary.length);
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
        <i class="pi pi-chart-line text-xs"></i>
        <span>Live Progress</span>
      </div>
    </div>

    <!-- macOS Widget Summary Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      <div
        class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >Total Vocabulary</span
          >
          <div
            class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center"
          >
            <i class="pi pi-book text-xs"></i>
          </div>
        </div>
        <div
          class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
        >
          {{ totalWords }}
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400">Full professional corpus</div>
      </div>

      <div
        class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >Words Mastered</span
          >
          <div
            class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center"
          >
            <i class="pi pi-check-circle text-xs"></i>
          </div>
        </div>
        <div
          class="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight"
        >
          {{ totalMastered }}
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400">Marked as fully memorized</div>
      </div>

      <div
        class="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-2"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >Overall Progress</span
          >
          <div
            class="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 flex items-center justify-center"
          >
            <i class="pi pi-chart-line text-xs"></i>
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
        <ProgressBar :value="lvl.percentage" class="!h-2 !rounded-full" />
      </div>
    </div>

    <!-- SRS Retention Pipeline Widget -->
    <div
      class="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          SRS Retention Pipeline
        </h3>
        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium"
          >Spaced Repetition Stages</span
        >
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          class="p-3 sm:p-4 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 text-center space-y-0.5"
        >
          <div class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">New</div>
          <div class="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200">
            {{ srsStages.newCount }}
          </div>
        </div>
        <div
          class="p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200/80 dark:bg-amber-500/10 dark:border-amber-500/25 text-center space-y-0.5"
        >
          <div class="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
            Learning (1-2)
          </div>
          <div class="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
            {{ srsStages.learningCount }}
          </div>
        </div>
        <div
          class="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200/80 dark:bg-blue-500/10 dark:border-blue-500/25 text-center space-y-0.5"
        >
          <div class="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
            Review (3-4)
          </div>
          <div class="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
            {{ srsStages.reviewCount }}
          </div>
        </div>
        <div
          class="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 dark:bg-emerald-500/10 dark:border-emerald-500/25 text-center space-y-0.5"
        >
          <div class="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
            Mastered (5+)
          </div>
          <div class="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {{ srsStages.masteredCount }}
          </div>
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
      <ProgressBar :value="totalPercentage" class="!h-2.5 !rounded-full" />

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
            label="Export Backup"
            icon="pi pi-download"
            severity="secondary"
            size="small"
            outlined
            @click="handleExport"
            class="!rounded-xl text-xs !py-1.5 !px-3 active:scale-95 transition-all font-semibold"
          />
          <Button
            label="Restore Progress"
            icon="pi pi-upload"
            severity="secondary"
            size="small"
            outlined
            @click="triggerFileInput"
            class="!rounded-xl text-xs !py-1.5 !px-3 active:scale-95 transition-all font-semibold"
          />
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
          <ProgressBar :value="item.percentage" class="!h-1.5 !rounded-full" />
        </div>
      </div>
    </div>
  </div>
</template>
