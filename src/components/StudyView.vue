<script setup lang="ts">
import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import VocabularyCard from './VocabularyCard.vue';
import type { Word, StudyDirection } from '../types';

defineProps<{
  vocabulary: Word[];
  currentStudyIndex: number;
  isFlipped: boolean;
  studyDirection: StudyDirection;
  isAutoplay: boolean;
  studyProgress: number;
  directionOptions: any[];
  audioOptions: any[];
  isShuffled?: boolean;
}>();

const emit = defineEmits([
  'update:studyDirection', 
  'update:isAutoplay', 
  'shuffle', 
  'flip', 
  'update-srs', 
  'prev', 
  'next',
  'toggle-mastered',
  'play-audio'
]);
</script>

<template>
  <div class="flex flex-col gap-8 max-w-[650px] mx-auto w-full px-2 sm:px-0">
    <!-- Controls -->
    <div class="flex justify-center gap-4 flex-wrap sm:flex-nowrap">
      <SelectButton 
        :modelValue="studyDirection" 
        @update:modelValue="emit('update:studyDirection', $event)"
        :options="directionOptions" 
        optionLabel="label" 
        optionValue="value" 
        :allowEmpty="false"
      />
      <SelectButton 
        :modelValue="isAutoplay" 
        @update:modelValue="emit('update:isAutoplay', $event)"
        :options="audioOptions" 
        optionLabel="label" 
        optionValue="value" 
        :allowEmpty="false"
      />
      <Button 
        label="Shuffle"
        icon="pi pi-random"
        :severity="isShuffled ? 'primary' : 'secondary'"
        @click="emit('shuffle')"
      />
    </div>

    <!-- Progress -->
    <ProgressBar :value="studyProgress" class="h-2 mb-2 w-full" />

    <!-- Card -->
    <div class="w-full flex justify-center">
      <VocabularyCard 
        v-if="vocabulary.length > 0"
        :word="vocabulary[currentStudyIndex]"
        :isFlipped="isFlipped"
        :direction="studyDirection"
        class="w-full"
        @flip="emit('flip')"
        @toggle-mastered="emit('toggle-mastered', $event)"
        @play-audio="emit('play-audio', $event)"
      />
    </div>

    <!-- SRS Buttons -->
    <div v-if="isFlipped" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 w-full">
      <Button label="AGAIN (1)" severity="danger" @click="emit('update-srs', 'again')" />
      <Button label="HARD (2)" severity="warning" @click="emit('update-srs', 'hard')" />
      <Button label="GOOD (3)" severity="success" @click="emit('update-srs', 'good')" />
      <Button label="EASY (4)" severity="info" @click="emit('update-srs', 'easy')" />
    </div>
    
    <!-- Navigation -->
    <div class="flex items-center gap-4 mt-6 w-full">
      <Button icon="pi pi-chevron-left" severity="secondary" @click="emit('prev')" />
      <div class="flex-1 text-center font-bold text-xl bg-surface-900 px-6 py-3 rounded-xl border border-surface-800 flex flex-col justify-center items-center">
        <div>{{ currentStudyIndex + 1 }} / {{ vocabulary.length }}</div>
        <div class="text-sm text-surface-400 font-normal mt-1 hidden sm:block">Space to flip &bull; Arrows to navigate</div>
      </div>
      <Button icon="pi pi-chevron-right" severity="secondary" @click="emit('next')" />
    </div>

    <!-- Shortcuts Legend -->
    <div class="bg-surface-900/50 border border-surface-800 rounded-2xl p-4 text-center mt-2 w-full">
      <div class="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 font-semibold">Keyboard Shortcuts</div>
      <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-surface-300">
        <div><kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">Space</kbd> Flip</div>
        <div><kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">&larr;</kbd> / <kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">&rarr;</kbd> Prev/Next</div>
        <div><kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">M</kbd> Mastered</div>
        <div v-if="isFlipped"><kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">1</kbd>-<kbd class="px-2 py-1 bg-surface-800 rounded text-xs border border-surface-700 font-mono">4</kbd> Grade</div>
      </div>
    </div>
  </div>
</template>
