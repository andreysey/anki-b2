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
  <div class="flex flex-col items-center self-center gap-6 max-w-[620px] w-full px-2 sm:px-0 animate-in fade-in duration-500">
    <!-- macOS Style Top Study Controls -->
    <div class="flex justify-between items-center w-full gap-3 flex-wrap sm:flex-nowrap">
      <div class="flex items-center gap-2">
        <SelectButton 
          :modelValue="studyDirection" 
          @update:modelValue="emit('update:studyDirection', $event)"
          :options="directionOptions" 
          optionLabel="label" 
          optionValue="value" 
          :allowEmpty="false"
          class="!rounded-xl text-xs"
        />
        <SelectButton 
          :modelValue="isAutoplay" 
          @update:modelValue="emit('update:isAutoplay', $event)"
          :options="audioOptions" 
          optionLabel="label" 
          optionValue="value" 
          :allowEmpty="false"
          class="!rounded-xl text-xs"
        />
      </div>

      <Button 
        label="Shuffle"
        icon="pi pi-random"
        size="small"
        :severity="isShuffled ? 'primary' : 'secondary'"
        outlined
        @click="emit('shuffle')"
        class="!rounded-xl active:scale-95 transition-all text-xs"
      />
    </div>

    <!-- macOS Slim Progress Meter -->
    <div class="w-full space-y-1.5">
      <div class="flex justify-between text-[11px] font-semibold text-surface-400">
        <span>Session Progress</span>
        <span>{{ currentStudyIndex + 1 }} of {{ vocabulary.length }}</span>
      </div>
      <ProgressBar :value="studyProgress" class="!h-1.5 !rounded-full" />
    </div>

    <!-- Centered Tactile Vocabulary Card -->
    <div class="w-full flex justify-center py-2">
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
      class="macos-floating-hud p-3 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-2xl"
    >
      <button 
        @click="emit('update-srs', 'again')" 
        class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 border border-red-500/30 text-red-400 font-bold transition-all group"
      >
        <span class="text-xs tracking-wide">AGAIN (1)</span>
        <span class="text-[10px] opacity-70 font-mono mt-0.5">Key 1</span>
      </button>

      <button 
        @click="emit('update-srs', 'hard')" 
        class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-500/30 text-amber-400 font-bold transition-all group"
      >
        <span class="text-xs tracking-wide">HARD (2)</span>
        <span class="text-[10px] opacity-70 font-mono mt-0.5">Key 2</span>
      </button>

      <button 
        @click="emit('update-srs', 'good')" 
        class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/30 text-emerald-400 font-bold transition-all group"
      >
        <span class="text-xs tracking-wide">GOOD (3)</span>
        <span class="text-[10px] opacity-70 font-mono mt-0.5">Key 3</span>
      </button>

      <button 
        @click="emit('update-srs', 'easy')" 
        class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 active:scale-95 border border-blue-500/30 text-blue-400 font-bold transition-all group"
      >
        <span class="text-xs tracking-wide">EASY (4)</span>
        <span class="text-[10px] opacity-70 font-mono mt-0.5">Key 4</span>
      </button>
    </div>
    
    <!-- Navigation Bar -->
    <div class="flex items-center gap-3 w-full">
      <Button 
        icon="pi pi-chevron-left" 
        severity="secondary" 
        rounded 
        outlined
        @click="emit('prev')" 
        class="hover:bg-white/10 active:scale-95"
        title="Previous Card (Left Arrow)"
      />
      <div class="flex-1 text-center py-2.5 px-4 rounded-xl bg-surface-900/50 dark:bg-white/5 border border-surface-800/80 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-surface-300">
        <div>{{ currentStudyIndex + 1 }} / {{ vocabulary.length }}</div>
        <div class="text-[11px] text-surface-400 font-normal hidden sm:block">Space to flip &bull; Arrows to navigate</div>
      </div>
      <Button 
        icon="pi pi-chevron-right" 
        severity="secondary" 
        rounded 
        outlined
        @click="emit('next')" 
        class="hover:bg-white/10 active:scale-95"
        title="Next Card (Right Arrow)"
      />
    </div>

    <!-- macOS Tactile Keyboard Shortcuts Strip -->
    <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-2 px-4 rounded-xl bg-surface-950/40 dark:bg-black/20 border border-surface-800/60 dark:border-white/5 text-[11px] text-surface-400 w-full">
      <div class="flex items-center gap-1.5"><kbd class="macos-kbd">␣</kbd> <span>Space to flip</span></div>
      <div class="flex items-center gap-1.5"><kbd class="macos-kbd">&larr;</kbd> <kbd class="macos-kbd">&rarr;</kbd> <span>Prev / Next</span></div>
      <div class="flex items-center gap-1.5"><kbd class="macos-kbd">M</kbd> <span>Master</span></div>
      <div v-if="isFlipped" class="flex items-center gap-1.5"><kbd class="macos-kbd">1</kbd>-<kbd class="macos-kbd">4</kbd> <span>Grade</span></div>
    </div>
  </div>
</template>
