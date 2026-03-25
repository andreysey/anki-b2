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

// Button PassThrough configurations
const ttsBtnPt = {
  root: 'flex-shrink-0 bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-all hover:bg-[#00d2ff] hover:text-[#0f172a] hover:scale-110 active:scale-95'
};

const settingsBtnPt = {
  root: 'flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 sm:flex-initial sm:min-w-[100px]'
};

const navBtnPt = {
  root: 'px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white transition-all hover:bg-white/10 active:scale-95 w-full flex items-center justify-center'
};

const cardListPt = {
  root: 'card glass px-0 py-0 transition-all hover:-translate-y-2 hover:border-[#00d2ff] group flex flex-col h-full overflow-hidden rounded-3xl border border-white/10',
  body: 'p-0 flex flex-col h-full',
  content: 'px-8 py-8 pt-2 flex flex-col h-full'
};

const badgeListPt = {
  root: 'px-2.5 py-1 rounded-md text-[0.7rem] font-bold uppercase tracking-widest shadow-sm border border-white/5'
};

const srsBtnPt = (color: string) => ({
  root: `p-3.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold tracking-wide transition-all hover:border-[${color}] hover:text-[${color}] active:scale-95 flex items-center justify-center`
});
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-[#f8fafc] font-['Outfit'] antialiased">
    <div class="max-w-[1200px] mx-auto px-6 py-10 sm:p-16 lg:p-20">
      <header class="text-center mb-10 sm:mb-16">
        <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent tracking-tight">
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
        <div v-if="!isStudyMode && filteredVocabulary.length === 0" class="flex flex-col items-center justify-center py-20 px-6 text-center glass rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
            <div class="text-7xl mb-8 opacity-20 filter grayscale">🔍</div>
            <h3 class="text-2xl sm:text-3xl font-bold text-white mb-4">No results found</h3>
            <p class="text-[#94a3b8] text-lg max-w-md mx-auto leading-relaxed">We couldn't find any vocabulary matching your current search or filter criteria. Try adjusting your filters.</p>
        </div>

        <!-- List View -->
        <div v-if="!isStudyMode && filteredVocabulary.length > 0" class="flex flex-col gap-16 sm:gap-24">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
            <Card 
              v-for="item in filteredVocabulary.slice(0, displayLimit)" 
              :key="getItemKey(item)" 
              :pt="cardListPt"
            >
              <template #header>
                <div class="flex justify-between p-8 pb-0">
                  <Badge :value="item.level" :pt="badgeListPt" class="!bg-[#00d2ff]/15 !text-[#00d2ff] !border-none" />
                  <Badge :value="'Thema ' + item.thema" :pt="badgeListPt" class="!bg-white/10 !text-[#94a3b8] !border-none" />
                </div>
              </template>
              <template #content>
                <div class="flex justify-between items-start mb-4 gap-4">
                  <div class="text-[1.3rem] sm:text-[1.6rem] font-bold leading-[1.2] text-white group-hover:text-[#00d2ff] transition-colors" v-html="item.german"></div>
                  <Button 
                    label="🔊" 
                    @click="playAudio(item.german_audio)" 
                    :pt="ttsBtnPt"
                    title="Play pronunciation"
                  />
                </div>
                <div class="space-y-2 mb-6">
                  <div class="text-[#a5b4fc] text-[1.1rem] font-semibold leading-snug">{{ item.english }}</div>
                  <div class="text-[#fde047] text-[1.1rem] font-semibold leading-snug">{{ item.ukrainian }}</div>
                </div>
                <template v-if="item.example">
                  <Divider :pt="{ root: 'my-6 border-white/5' }" />
                  <div class="italic text-[#94a3b8] text-[0.95rem] leading-relaxed opacity-80" v-html="item.example"></div>
                </template>
              </template>
            </Card>
          </div>

          <!-- Load More -->
          <div v-if="displayLimit < filteredVocabulary.length" class="flex justify-center pb-20">
            <Button 
              label="Explore More Vocabulary +" 
              @click="loadMore"
              :pt="{
                root: 'px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[#00d2ff] font-black tracking-[0.2em] uppercase text-[0.7rem] hover:bg-[#00d2ff]/10 hover:border-[#00d2ff]/30 transition-all active:scale-95 shadow-2xl hover:shadow-[#00d2ff]/10'
              }"
            />
          </div>
        </div>

        <!-- Study Mode -->
        <div v-else class="flex flex-col gap-8 max-w-[650px] mx-auto w-full px-2 sm:px-0">
          <div class="flex justify-center gap-3 flex-wrap sm:flex-nowrap">
            <Button 
              :label="'🔄 ' + (studyDirection === 'DE_TO_UA' ? 'DE' : 'UA')"
              :pt="settingsBtnPt"
              @click="studyDirection = studyDirection === 'DE_TO_UA' ? 'UA_TO_DE' : 'DE_TO_UA'"
            />
            <Button 
              :label="'🔊 ' + (isAutoplay ? 'On' : 'Off')"
              :pt="{
                root: [
                  settingsBtnPt.root,
                  isAutoplay ? '!bg-[#00d2ff]/20 !border-[#00d2ff]/40 !text-[#00d2ff]' : ''
                ]
              }"
              @click="isAutoplay = !isAutoplay"
            />
            <Button 
              label="🔀 Shuffle"
              unstyled
              :pt="settingsBtnPt"
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
            <Button label="🔴 AGAIN" :pt="srsBtnPt('#ff4d4d')" @click="updateSRS('again')" />
            <Button label="🟡 HARD" :pt="srsBtnPt('#ffcc00')" @click="updateSRS('hard')" />
            <Button label="🟢 GOOD" :pt="srsBtnPt('#33cc33')" @click="updateSRS('good')" />
            <Button label="🔵 EASY" :pt="srsBtnPt('#3399ff')" @click="updateSRS('easy')" />
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-[1fr,auto,1fr] items-center gap-4 mt-6">
            <Button label="⬅️" :pt="navBtnPt" @click="prevCard" />
            <div class="text-center font-black text-xl text-white tracking-widest whitespace-nowrap order-last sm:order-none col-span-2 sm:col-span-1 mt-2 sm:mt-0 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 shadow-inner">
              {{ currentStudyIndex + 1 }} <span class="text-white/20 mx-1">/</span> {{ filteredVocabulary.length }}
            </div>
            <Button label="➡️" :pt="navBtnPt" @click="nextCard" />
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
