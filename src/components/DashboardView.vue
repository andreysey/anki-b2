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
    srsData: () => ({}),
  }
);

const emit = defineEmits<{
  (e: 'restore-progress', payload: { masteredIds: string[]; srsData: Record<string, SRSState> }): void;
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
        srsData: result.data.srsData,
      });
      importSuccess.value = `Successfully restored ${result.data.masteredIds.length} mastered words and ${Object.keys(result.data.srsData).length} SRS cards.`;
      importError.value = null;
    } else {
      importError.value = result.error || 'Failed to import backup file';
      importSuccess.value = null;
    }
  };
  reader.readAsText(file);
  // Reset input so the same file can be re-selected if needed
  target.value = '';
};

// Level Statistics (B1+ vs B2)
const levelStats = computed(() => {
  const levels = ['B1+', 'B2'];
  return levels.map(lvl => {
    const words = props.vocabulary.filter(w => w.level === lvl);
    const total = words.length;
    const mastered = words.filter(w => props.masteredIds.has(getItemKey(w))).length;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return {
      level: lvl,
      total,
      mastered,
      percentage,
    };
  });
});

// SRS Stage Distribution
const srsStages = computed(() => {
  let newCount = 0;
  let learningCount = 0; // Level 1-2
  let reviewCount = 0;   // Level 3-4
  let masteredCount = 0; // Level 5 or in masteredIds

  props.vocabulary.forEach(w => {
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
    masteredCount,
  };
});

// Grouping by Thema
const stats = computed(() => {
  if (props.vocabulary.length === 0) return [];

  const themesMap = new Map<number, { total: number; mastered: number }>();
  
  props.vocabulary.forEach(word => {
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

  return Array.from(themesMap.entries()).map(([thema, item]) => {
    const name = getThemaLabel(thema);
    const percentage = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;

    return {
      thema,
      name,
      total: item.total,
      mastered: item.mastered,
      percentage
    };
  }).sort((a, b) => a.thema - b.thema);
});

const totalMastered = computed(() => props.masteredIds.size);
const totalWords = computed(() => props.vocabulary.length);
const totalPercentage = computed(() => {
  if (totalWords.value === 0) return 0;
  return Math.round((totalMastered.value / totalWords.value) * 100);
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Overall stats summary banner -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Total Vocabulary</div>
        <div class="text-4xl font-extrabold text-surface-900 dark:text-white">{{ totalWords }}</div>
      </div>
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Words Mastered</div>
        <div class="text-4xl font-extrabold text-success-500">{{ totalMastered }}</div>
      </div>
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Overall Progress</div>
        <div class="text-4xl font-extrabold text-primary-500">{{ totalPercentage }}%</div>
      </div>
    </div>

    <!-- Level Progress Breakdown -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="lvl in levelStats" 
        :key="lvl.level"
        class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-3"
      >
        <div class="flex justify-between items-center text-sm font-bold">
          <span class="text-surface-100">Level {{ lvl.level }} Progress</span>
          <span class="text-primary">{{ lvl.mastered }} / {{ lvl.total }} ({{ lvl.percentage }}%)</span>
        </div>
        <ProgressBar :value="lvl.percentage" class="h-3" />
      </div>
    </div>

    <!-- SRS Learning Stages Breakdown -->
    <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-4">
      <h3 class="text-lg font-bold text-surface-900 dark:text-white">SRS Retention Pipeline</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-surface-950/60 border border-surface-800 text-center">
          <div class="text-xs uppercase font-bold text-surface-400 mb-1">New</div>
          <div class="text-2xl font-bold text-surface-200">{{ srsStages.newCount }}</div>
        </div>
        <div class="p-4 rounded-xl bg-surface-950/60 border border-surface-800 text-center">
          <div class="text-xs uppercase font-bold text-yellow-400 mb-1">Learning (1-2)</div>
          <div class="text-2xl font-bold text-yellow-400">{{ srsStages.learningCount }}</div>
        </div>
        <div class="p-4 rounded-xl bg-surface-950/60 border border-surface-800 text-center">
          <div class="text-xs uppercase font-bold text-blue-400 mb-1">Review (3-4)</div>
          <div class="text-2xl font-bold text-blue-400">{{ srsStages.reviewCount }}</div>
        </div>
        <div class="p-4 rounded-xl bg-surface-950/60 border border-surface-800 text-center">
          <div class="text-xs uppercase font-bold text-green-400 mb-1">Mastered (5+)</div>
          <div class="text-2xl font-bold text-green-400">{{ srsStages.masteredCount }}</div>
        </div>
      </div>
    </div>

    <!-- Overall Progress bar & Backup Toolbar -->
    <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-4">
      <div class="flex justify-between items-center text-sm font-semibold flex-wrap gap-2">
        <span class="text-surface-200">Overall Course Progress</span>
        <span class="text-primary">{{ totalMastered }} / {{ totalWords }} mastered</span>
      </div>
      <ProgressBar :value="totalPercentage" class="h-4" />

      <!-- Backup and Restore Actions -->
      <div class="pt-4 border-t border-surface-800 flex items-center justify-between flex-wrap gap-4">
        <div class="text-xs text-surface-400">
          Sync your progress across devices by exporting a backup JSON file.
        </div>
        <div class="flex gap-3">
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
          />
          <Button 
            label="Restore Progress" 
            icon="pi pi-upload" 
            severity="secondary" 
            size="small" 
            outlined 
            @click="triggerFileInput" 
          />
        </div>
      </div>

      <!-- Feedback messages -->
      <div v-if="importSuccess" class="text-xs text-green-400 font-medium">
        {{ importSuccess }}
      </div>
      <div v-if="importError" class="text-xs text-red-400 font-medium">
        {{ importError }}
      </div>
    </div>

    <!-- Detailed Theme Progress -->
    <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-6">
      <h3 class="text-lg font-bold text-surface-900 dark:text-white border-b border-surface-800 pb-3">Progress by Topic & Category</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="item in stats" :key="item.thema" class="space-y-2 p-4 bg-surface-950/45 border border-surface-800/60 rounded-xl hover:border-primary-500/35 transition-colors duration-300">
          <div class="flex justify-between items-start">
            <span class="font-bold text-sm text-surface-100 line-clamp-1" :title="item.name">{{ item.name }}</span>
            <span class="text-xs font-semibold text-surface-400 shrink-0">{{ item.mastered }}/{{ item.total }} ({{ item.percentage }}%)</span>
          </div>
          <ProgressBar :value="item.percentage" class="h-2" />
        </div>
      </div>
    </div>
  </div>
</template>
