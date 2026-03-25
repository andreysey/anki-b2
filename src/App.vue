<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import FilterBar from './components/FilterBar.vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed } from 'vue';
import BaseLayout from './components/BaseLayout.vue';
import AppHero from './components/AppHero.vue';
import VocabularyList from './components/VocabularyList.vue';
import StudyView from './components/StudyView.vue';

const {
  vocabulary,
  filteredVocabulary,
  search,
  levelFilter,
  themaFilter,
  isStudyMode,
  currentStudyIndex,
  isFlipped,
  studyDirection,
  isAutoplay,
  displayLimit,
  init,
  updateSRS,
  nextCard,
  prevCard,
  shuffleCards,
  loadMore
} = useVocabulary();

const toast = useToast();

const studyProgress = computed(() => {
  if (filteredVocabulary.value.length === 0) return 0;
  return Math.round(((currentStudyIndex.value + 1) / filteredVocabulary.value.length) * 100);
});

const directionOptions = [
  { label: 'DE', value: 'DE_TO_UA' },
  { label: 'UA', value: 'UA_TO_DE' }
];

const audioOptions = [
  { label: 'Audio On', value: true },
  { label: 'Audio Off', value: false }
];

const handleSRSUpdate = (severity: 'again' | 'hard' | 'good' | 'easy') => {
  updateSRS(severity);
  const labels: Record<string, string> = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };
  const toastSeverity: Record<string, 'error' | 'warn' | 'success' | 'info'> = {
    again: 'error',
    hard: 'warn',
    good: 'success',
    easy: 'info'
  };
  
  toast.add({ 
    severity: toastSeverity[severity], 
    summary: 'Graded', 
    detail: labels[severity], 
    life: 2000 
  });
};

onMounted(() => {
  init();
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!isStudyMode.value) return;
  
  if (e.code === 'Space') {
    e.preventDefault();
    isFlipped.value = !isFlipped.value;
  } else if (e.code === 'ArrowRight') {
    nextCard();
  } else if (e.code === 'ArrowLeft') {
    prevCard();
  } else if (isFlipped.value) {
    if (e.key === '1') handleSRSUpdate('again');
    else if (e.key === '2') handleSRSUpdate('hard');
    else if (e.key === '3') handleSRSUpdate('good');
    else if (e.key === '4') handleSRSUpdate('easy');
  }
};

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

const openGitHub = () => {
  window.open('https://github.com/andreysey/anki-b2', '_blank');
};

const appVersion = __APP_VERSION__;
</script>

<template>
  <BaseLayout :app-version="appVersion">
    <template #header-end>
      <div class="flex items-center gap-2">
        <Button icon="pi pi-github" text rounded severity="secondary" @click="openGitHub" />
        <Button :icon="isStudyMode ? 'pi pi-list' : 'pi pi-graduation-cap'" :label="isStudyMode ? 'List' : 'Study'" severity="primary" @click="isStudyMode = !isStudyMode" />
      </div>
    </template>

    <AppHero />

    <FilterBar 
      :vocabulary="vocabulary"
      v-model:search="search"
      v-model:level="levelFilter"
      v-model:thema="themaFilter"
      v-model:isStudyMode="isStudyMode"
    />

    <!-- Empty State -->
    <Message v-if="filteredVocabulary.length === 0" severity="secondary" icon="pi pi-search" class="mb-12">
        No results found matching your current search or filter criteria. Try adjusting your filters.
    </Message>

    <!-- List View -->
    <VocabularyList 
      v-if="!isStudyMode && filteredVocabulary.length > 0"
      :vocabulary="filteredVocabulary"
      :display-limit="displayLimit"
      @load-more="loadMore"
      @play-audio="playAudio"
    />

    <!-- Study Mode -->
    <StudyView 
      v-else-if="isStudyMode && filteredVocabulary.length > 0"
      :vocabulary="filteredVocabulary"
      :current-study-index="currentStudyIndex"
      :is-flipped="isFlipped"
      v-model:study-direction="studyDirection"
      v-model:is-autoplay="isAutoplay"
      :study-progress="studyProgress"
      :direction-options="directionOptions"
      :audio-options="audioOptions"
      @shuffle="shuffleCards"
      @flip="isFlipped = !isFlipped"
      @update-srs="handleSRSUpdate"
      @prev="prevCard"
      @next="nextCard"
    />

    <Toast />
  </BaseLayout>
</template>

<style>
/* base.css is already imported in main.css */
</style>
