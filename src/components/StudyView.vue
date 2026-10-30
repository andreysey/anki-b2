<script setup lang="ts">
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import VocabularyCard from './VocabularyCard.vue';
import StudyControls from './StudyControls.vue';
import GradeButtons from './GradeButtons.vue';
import { ChevronLeft, ChevronRight, Check } from '@lucide/vue';
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
  sessionReviewedCount?: number;
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
  (e: 'play-audio', text: string, lang?: string): void;
}>();
</script>

<template>
  <div
    class="flex flex-col items-center self-center gap-4 max-w-145 lg:has-[.ai-expanded]:max-w-205 w-full px-1 sm:px-0 py-0 transition-[max-width] duration-500 animate-in fade-in"
  >
    <h1 class="sr-only">Study mode</h1>
    <StudyControls
      :study-direction="studyDirection"
      :is-autoplay="isAutoplay"
      :direction-options="directionOptions"
      :audio-options="audioOptions"
      :is-shuffled="isShuffled"
      @update:study-direction="emit('update:studyDirection', $event)"
      @update:is-autoplay="emit('update:isAutoplay', $event)"
      @shuffle="emit('shuffle')"
    />

    <!-- macOS Progress Meter & Session Stats -->
    <div class="w-full space-y-1.5">
      <div
        class="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400"
      >
        <div class="flex items-center gap-2">
          <span>Session Progress</span>
          <span
            v-if="sessionReviewedCount"
            class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold tabular-ticker"
          >
            <Check class="h-2.5 w-2.5" />
            {{ sessionReviewedCount }} reviewed
          </span>
        </div>
        <span class="tabular-ticker font-mono"
          >{{ currentStudyIndex + 1 }} of {{ vocabulary.length }}</span
        >
      </div>
      <Progress :modelValue="studyProgress" class="h-1.5" />
    </div>

    <!-- Centered Tactile Vocabulary Card with Touch Swipes & Mobile Scroll Snap -->
    <div class="w-full flex justify-center py-0.5 study-card-snap-item">
      <VocabularyCard
        v-if="vocabulary.length"
        :word="vocabulary[currentStudyIndex]"
        :isFlipped="isFlipped"
        :direction="studyDirection"
        @flip="emit('flip')"
        @toggle-mastered="emit('toggle-mastered', $event)"
        @play-audio="(text, lang) => emit('play-audio', text, lang)"
        @swipe-left="emit('update-srs', 'again')"
        @swipe-right="emit('update-srs', 'good')"
      />
    </div>

    <GradeButtons v-if="isFlipped" @grade="emit('update-srs', $event)" />

    <!-- Navigation Bar -->
    <div class="flex items-center gap-2.5 w-full">
      <Button
        variant="outline"
        size="icon"
        @click="emit('prev')"
        class="rounded-full w-10 h-10 shrink-0 text-slate-600 dark:text-slate-300"
        title="Previous Card (Left Arrow)"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <div
        class="flex-1 text-center py-2 px-3 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
      >
        <div>{{ currentStudyIndex + 1 }} / {{ vocabulary.length }}</div>
        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
          Space or Tap to flip &bull; Swipe Left/Right to grade
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        @click="emit('next')"
        class="rounded-full w-10 h-10 shrink-0 text-slate-600 dark:text-slate-300"
        title="Next Card (Right Arrow)"
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <!-- macOS Tactile Keyboard Shortcuts & Gesture Strip -->
    <div
      class="pointer-coarse:hidden flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 py-2 px-4 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 w-full shadow-2xs"
    >
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">␣</kbd> <span>Space / Tap to flip</span>
      </div>
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">1-4</kbd> <span>Grade retention</span>
      </div>
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">&larr;</kbd> <kbd class="macos-kbd">&rarr;</kbd>
        <span>Navigate</span>
      </div>
      <div class="flex items-center gap-1.5">
        <kbd class="macos-kbd">M</kbd> <span>Master</span>
      </div>
    </div>
  </div>
</template>
