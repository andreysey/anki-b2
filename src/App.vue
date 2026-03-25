<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import FilterBar from './components/FilterBar.vue';
import VocabularyCard from './components/VocabularyCard.vue';
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import Button from 'primevue/button';

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
    if (e.key === '1') updateSRS('again');
    else if (e.key === '2') updateSRS('hard');
    else if (e.key === '3') updateSRS('good');
    else if (e.key === '4') updateSRS('easy');
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
        <div v-if="!isStudyMode && filteredVocabulary.length === 0" class="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl border border-surface-800 bg-surface-900 shadow-2xl animate-in fade-in zoom-in duration-500">
            <div class="text-7xl mb-8 opacity-20">🔍</div>
            <h3 class="text-2xl sm:text-3xl font-bold mb-4">No results found</h3>
            <p class="text-surface-400 text-lg max-w-md mx-auto leading-relaxed">We couldn't find any vocabulary matching your current search or filter criteria. Try adjusting your filters.</p>
        </div>

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
          <div class="flex justify-center gap-3 flex-wrap sm:flex-nowrap">
            <Button 
              :label="'Direction: ' + (studyDirection === 'DE_TO_UA' ? 'DE' : 'UA')"
              icon="pi pi-refresh"
              severity="secondary"
              @click="studyDirection = studyDirection === 'DE_TO_UA' ? 'UA_TO_DE' : 'DE_TO_UA'"
            />
            <Button 
              :label="'Audio: ' + (isAutoplay ? 'On' : 'Off')"
              icon="pi pi-volume-up"
              :severity="isAutoplay ? 'primary' : 'secondary'"
              @click="isAutoplay = !isAutoplay"
            />
            <Button 
              label="Shuffle"
              icon="pi pi-random"
              severity="secondary"
              @click="shuffleCards"
            />
          </div>

          <VocabularyCard 
            v-if="filteredVocabulary.length > 0"
            :word="filteredVocabulary[currentStudyIndex]"
            :isFlipped="isFlipped"
            :direction="studyDirection"
            @flip="isFlipped = !isFlipped"
          />

          <div v-if="isFlipped" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            <Button label="AGAIN" severity="danger" @click="updateSRS('again')" />
            <Button label="HARD" severity="warning" @click="updateSRS('hard')" />
            <Button label="GOOD" severity="success" @click="updateSRS('good')" />
            <Button label="EASY" severity="info" @click="updateSRS('easy')" />
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

      <footer class="mt-24 pb-16 text-center text-[#94a3b8] opacity-60 hover:opacity-100 transition-opacity">
        <p class="text-sm font-medium tracking-wide">Version <span id="app-version">v{{ appVersion }}</span></p>
      </footer>
    </div>
  </div>
</template>

<style>
/* base.css is already imported in main.css */
</style>
