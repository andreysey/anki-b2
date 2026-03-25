<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import FilterBar from './components/FilterBar.vue';
import VocabularyCard from './components/VocabularyCard.vue';
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed } from 'vue';

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
  loadMore,
  getItemKey
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

const appVersion = __APP_VERSION__;
</script>

<template>
  <div class="min-h-screen bg-surface-950 text-surface-0 font-['Outfit'] antialiased">
    <div class="max-w-[1200px] mx-auto px-6 py-10 sm:p-16 lg:p-20">
      <header class="text-center mb-10 sm:mb-16">
        <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 tracking-tight">
          German B1+/B2 Beruf
        </h1>
        <p class="text-base sm:text-lg md:text-2xl opacity-70 font-medium">Interactive Professional Vocabulary Dictionary</p>
      </header>

      <main class="mt-12 sm:mt-20">
        <FilterBar 
          :vocabulary="vocabulary"
          v-model:search="search"
          v-model:level="levelFilter"
          v-model:thema="themaFilter"
          v-model:isStudyMode="isStudyMode"
        />

        <!-- Empty State -->
        <Message v-if="!isStudyMode && filteredVocabulary.length === 0" severity="secondary" icon="pi pi-search" class="mb-12">
            No results found matching your current search or filter criteria. Try adjusting your filters.
        </Message>

        <!-- List View -->
        <div v-if="!isStudyMode && filteredVocabulary.length > 0" class="flex flex-col gap-16 sm:gap-24">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
            <Card 
              v-for="item in filteredVocabulary.slice(0, displayLimit)" 
              :key="getItemKey(item)" 
            >
              <template #header>
                <div class="flex justify-between p-6 pb-0">
                  <Badge :value="item.level" severity="info" />
                  <Badge :value="'Thema ' + item.thema" severity="secondary" />
                </div>
              </template>
              <template #content>
                <div class="flex justify-between items-start mb-4 gap-4">
                  <div class="text-xl font-bold leading-tight" v-html="item.german"></div>
                  <Button 
                    icon="pi pi-volume-up" 
                    rounded 
                    text 
                    @click="playAudio(item.german_audio)" 
                    title="Play pronunciation"
                  />
                </div>
                <div class="space-y-2 mb-4">
                  <div class="text-primary-400 font-semibold">{{ item.english }}</div>
                  <div class="text-orange-400 font-semibold">{{ item.ukrainian }}</div>
                </div>
                <template v-if="item.example">
                  <Divider />
                  <div class="italic text-surface-400 text-sm leading-relaxed" v-html="item.example"></div>
                </template>
              </template>
            </Card>
          </div>

          <!-- Load More -->
          <div v-if="displayLimit < filteredVocabulary.length" class="flex justify-center pb-20">
            <Button 
              label="Explore More Vocabulary" 
              icon="pi pi-plus"
              @click="loadMore"
              outlined
            />
          </div>
        </div>

        <!-- Study Mode -->
        <div v-else class="flex flex-col gap-8 max-w-[650px] mx-auto w-full px-2 sm:px-0">
          <div class="flex justify-center gap-4 flex-wrap sm:flex-nowrap">
            <SelectButton 
              v-model="studyDirection" 
              :options="directionOptions" 
              optionLabel="label" 
              optionValue="value" 
              :allowEmpty="false"
            />
            <SelectButton 
              v-model="isAutoplay" 
              :options="audioOptions" 
              optionLabel="label" 
              optionValue="value" 
              :allowEmpty="false"
            />
            <Button 
              label="Shuffle"
              icon="pi pi-random"
              severity="secondary"
              @click="shuffleCards"
            />
          </div>

          <ProgressBar :value="studyProgress" class="h-2 mb-2" />

          <VocabularyCard 
            v-if="filteredVocabulary.length > 0"
            :word="filteredVocabulary[currentStudyIndex]"
            :isFlipped="isFlipped"
            :direction="studyDirection"
            @flip="isFlipped = !isFlipped"
          />

          <div v-if="isFlipped" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <Button label="AGAIN" severity="danger" @click="handleSRSUpdate('again')" />
            <Button label="HARD" severity="warning" @click="handleSRSUpdate('hard')" />
            <Button label="GOOD" severity="success" @click="handleSRSUpdate('good')" />
            <Button label="EASY" severity="info" @click="handleSRSUpdate('easy')" />
          </div>
          
          <div class="flex items-center gap-4 mt-6">
            <Button icon="pi pi-chevron-left" severity="secondary" @click="prevCard" />
            <div class="flex-1 text-center font-bold text-xl bg-surface-900 px-6 py-3 rounded-xl border border-surface-800">
              {{ currentStudyIndex + 1 }} / {{ filteredVocabulary.length }}
            </div>
            <Button icon="pi pi-chevron-right" severity="secondary" @click="nextCard" />
          </div>
        </div>
      </main>

      <footer class="mt-24 pb-16 text-center text-surface-500 transition-opacity">
        <p class="text-sm font-medium tracking-wide">
          <Tag :value="'v' + appVersion" severity="secondary" rounded />
        </p>
      </footer>
    </div>
    <Toast />
  </div>
</template>

<style>
/* base.css is already imported in main.css */
</style>
