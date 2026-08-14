<script setup lang="ts">
import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import VocabularyCard from './VocabularyCard.vue';
import type { Word, StudyDirection, SelectOption } from '../types';

defineProps<{
  vocabulary: Word[];
  currentStudyIndex: number;
  isFlipped: boolean;
  studyDirection: StudyDirection;
  isAutoplay: boolean;
  studyProgress: number;
  directionOptions: SelectOption<StudyDirection>[];
  audioOptions: SelectOption<boolean>[];
  isShuffled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:studyDirection', value: StudyDirection): void;
  (e: 'update:isAutoplay', value: boolean): void;
  (e: 'shuffle'): void;
  (e: 'flip'): void;
  (e: 'update-srs', rating: 'again' | 'hard' | 'good' | 'easy'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'toggle-mastered', word: Word): void;
  (e: 'play-audio', text: string): void;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center self-center gap-4 max-w-[580px] w-full px-1 sm:px-0 py-0 animate-in fade-in duration-500"
  >
    <!-- macOS Style Top Study Controls -->
    <div class="flex justify-between items-center w-full gap-2.5 flex-wrap sm:flex-nowrap">
      <div class="flex items-center gap-2">
        <SelectButton
          :modelValue="studyDirection"
          @update:modelValue="emit('update:studyDirection', $event)"
          :options="directionOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          class="!rounded-xl text-xs shadow-2xs"
        />
        <SelectButton
          :modelValue="isAutoplay"
          @update:modelValue="emit('update:isAutoplay', $event)"
          :options="audioOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          class="!rounded-xl text-xs shadow-2xs"
        />
      </div>

      <Button
        label="Shuffle"
        icon="pi pi-random"
        size="small"
        :severity="isShuffled ? 'primary' : 'secondary'"
        outlined
        @click="emit('shuffle')"
        class="!rounded-xl active:scale-95 transition-all text-xs !py-1.5 !px-3 shadow-2xs"
      />
    </div>

    <!-- macOS Progress Meter -->
    <div class="w-full space-y-1.5">
      <div
        class="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400"
      >
        <span>Session Progress</span>
        <span>{{ currentStudyIndex + 1 }} of {{ vocabulary.length }}</span>
      </div>
      <ProgressBar :value="studyProgress" class="!h-1.5 !rounded-full" />
    </div>

    <!-- Centered Tactile Vocabulary Card -->
    <div class="w-full flex justify-center py-0.5">
      <VocabularyCard
        v-if="vocabulary.length > 0"
        :word="vocabulary[currentStudyIndex]"
        :isFlipped="isFlipped"
        :direction="studyDirection"
        @flip="emit('flip')"
        @toggle-mastered="emit('toggle-mastered', $event)"
        @play-audio="emit('play-audio', $event)"
      />
    </div>

    <!-- macOS Floating Action Island (SRS Grading HUD) -->
    <div
      v-if="isFlipped"
      class="macos-floating-hud p-2.5 w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-slate-200/40 dark:shadow-2xl"
    >
      <button
        @click="emit('update-srs', 'again')"
        class="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-red-50 hover:bg-red-100/80 dark:bg-red-500/15 dark:hover:bg-red-500/25 active:scale-95 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold transition-all cursor-pointer group"
      >
        <span class="text-xs tracking-wide">AGAIN (1)</span>
        <span class="text-[9.5px] opacity-70 font-mono mt-0.5">Key 1</span>
      </button>

      <button
        @click="emit('update-srs', 'hard')"
        class="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 active:scale-95 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold transition-all cursor-pointer group"
      >
        <span class="text-xs tracking-wide">HARD (2)</span>
        <span class="text-[9.5px] opacity-70 font-mono mt-0.5">Key 2</span>
      </button>

      <button
        @click="emit('update-srs', 'good')"
        class="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 active:scale-95 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold transition-all cursor-pointer group"
      >
        <span class="text-xs tracking-wide">GOOD (3)</span>
        <span class="text-[9.5px] opacity-70 font-mono mt-0.5">Key 3</span>
      </button>

      <button
        @click="emit('update-srs', 'easy')"
        class="flex flex-col items-center justify-center py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 active:scale-95 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 font-bold transition-all cursor-pointer group"
      >
        <span class="text-xs tracking-wide">EASY (4)</span>
        <span class="text-[9.5px] opacity-70 font-mono mt-0.5">Key 4</span>
      </button>
    </div>

    <!-- Navigation Bar -->
    <div class="flex items-center gap-2.5 w-full">
      <Button
        icon="pi pi-chevron-left"
        severity="secondary"
        rounded
        outlined
        @click="emit('prev')"
        class="hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 !w-10 !h-10 shrink-0 text-slate-600 dark:text-slate-300"
        title="Previous Card (Left Arrow)"
      />
      <div
        class="flex-1 text-center py-2 px-3 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
      >
        <div>{{ currentStudyIndex + 1 }} / {{ vocabulary.length }}</div>
        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
          Space to flip &bull; Arrows to navigate
        </div>
      </div>
      <Button
        icon="pi pi-chevron-right"
        severity="secondary"
        rounded
        outlined
        @click="emit('next')"
        class="hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 !w-10 !h-10 shrink-0 text-slate-600 dark:text-slate-300"
        title="Next Card (Right Arrow)"
      />
    </div>

    <!-- macOS Tactile Keyboard Shortcuts Strip -->
    <div
      class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 py-2 px-4 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 w-full shadow-2xs"
    >
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">␣</kbd> <span>Space to flip</span>
      </div>
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">&larr;</kbd> <kbd class="macos-kbd">&rarr;</kbd>
        <span>Prev / Next</span>
      </div>
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">M</kbd> <span>Master</span>
      </div>
      <div v-if="isFlipped" class="flex items-center gap-1.5">
        <kbd class="macos-kbd">1</kbd>-<kbd class="macos-kbd">4</kbd> <span>Grade</span>
      </div>
    </div>
  </div>
</template>
