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
}>();

const emit = defineEmits([
  'update:studyDirection', 
  'update:isAutoplay', 
  'shuffle', 
  'flip', 
  'update-srs', 
  'prev', 
  'next'
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
        severity="secondary"
        @click="emit('shuffle')"
      />
    </div>

    <!-- Progress -->
    <ProgressBar :value="studyProgress" class="h-2 mb-2" />

    <!-- Card -->
    <VocabularyCard 
      v-if="vocabulary.length > 0"
      :word="vocabulary[currentStudyIndex]"
      :isFlipped="isFlipped"
      :direction="studyDirection"
      @flip="emit('flip')"
    />

    <!-- SRS Buttons -->
    <div v-if="isFlipped" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
      <Button label="AGAIN" severity="danger" @click="emit('update-srs', 'again')" />
      <Button label="HARD" severity="warning" @click="emit('update-srs', 'hard')" />
      <Button label="GOOD" severity="success" @click="emit('update-srs', 'good')" />
      <Button label="EASY" severity="info" @click="emit('update-srs', 'easy')" />
    </div>
    
    <!-- Navigation -->
    <div class="flex items-center gap-4 mt-6">
      <Button icon="pi pi-chevron-left" severity="secondary" @click="emit('prev')" />
      <div class="flex-1 text-center font-bold text-xl bg-surface-900 px-6 py-3 rounded-xl border border-surface-800">
        {{ currentStudyIndex + 1 }} / {{ vocabulary.length }}
      </div>
      <Button icon="pi pi-chevron-right" severity="secondary" @click="emit('next')" />
    </div>
  </div>
</template>
