<script setup lang="ts">
import { ref } from 'vue';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Download, Upload } from 'lucide-vue-next';
import { downloadBackupFile, parseAndValidateBackup, MAX_BACKUP_SIZE_BYTES } from '../utils/backup';
import type { SRSState } from '../types';

const props = defineProps<{
  totalWords: number;
  totalMastered: number;
  totalPercentage: number;
  masteredIds: Set<string>;
  srsData?: Record<string, SRSState>;
}>();

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
  downloadBackupFile(props.masteredIds, props.srsData ?? {});
};

const triggerFileInput = () => {
  importError.value = null;
  importSuccess.value = null;
  fileInputRef.value?.click();
};

const processBackupContent = (content: string) => {
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

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (file.size > MAX_BACKUP_SIZE_BYTES) {
    importError.value = 'Backup file exceeds maximum allowed size of 5 MB';
    importSuccess.value = null;
    target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    processBackupContent(e.target?.result as string);
  };
  reader.onerror = () => {
    importError.value = 'Failed to read backup file from disk.';
    importSuccess.value = null;
  };
  reader.readAsText(file);
  target.value = '';
};
</script>

<template>
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
</template>
