<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import VocabularyCard from './components/VocabularyCard.vue';
import FilterBar from './components/FilterBar.vue';
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
  init,
  updateSRS,
  nextCard,
  prevCard,
  shuffleCards,
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

const srsBtnPt = (color: string) => ({
  root: `p-3.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold tracking-wide transition-all hover:border-[${color}] hover:text-[${color}] active:scale-95 flex items-center justify-center`
});
</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-[#f8fafc] font-['Outfit']">
    <div class="max-w-[1200px] mx-auto p-4 sm:p-8">
      <header class="text-center mb-12">
        <h1 class="text-3xl sm:text-5xl font-semibold mb-2 bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent">
          German B1+/B2 Beruf
        </h1>
        <p class="text-lg sm:text-xl opacity-70">Interactive Vocabulary Dictionary</p>
      </header>

      <main>
        <FilterBar 
          :vocabulary="vocabulary"
          v-model:search="search"
          v-model:level="levelFilter"
          v-model:thema="themaFilter"
          v-model:isStudyMode="isStudyMode"
        />

        <!-- List View -->
        <div v-if="!isStudyMode" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="item in filteredVocabulary.slice(0, 50)" :key="getItemKey(item)" class="card glass px-4 py-5 sm:p-6 transition-all hover:-translate-y-1 hover:border-[#00d2ff]">
            <div class="flex justify-between mb-4">
                <span class="bg-[#00d2ff]/15 text-[#00d2ff] px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wider">{{ item.level }}</span>
                <span class="bg-white/10 text-[#94a3b8] px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase tracking-wider">Thema {{ item.thema }}</span>
            </div>
            <div class="flex justify-between items-start mb-3 gap-4">
                <div class="text-[1.3rem] sm:text-[1.5rem] font-semibold leading-tight text-white" v-html="item.german"></div>
                <Button 
                  label="🔊" 
                  @click="playAudio(item.german_audio)" 
                  unstyled 
                  :pt="ttsBtnPt"
                  title="Play pronunciation"
                />
            </div>
            <div class="space-y-1.5 mb-4">
                <div class="text-[#818cf8] text-[1.05rem] font-medium leading-snug">{{ item.english }}</div>
                <div class="text-[#facc15] text-[1.05rem] font-medium leading-snug">{{ item.ukrainian }}</div>
            </div>
            <div v-if="item.example" class="mt-auto pt-4 border-t border-white/10 italic text-[#94a3b8] text-[0.9rem] leading-relaxed" v-html="item.example"></div>
          </div>
        </div>

        <!-- Study Mode -->
        <div v-else class="flex flex-col gap-6 max-w-[600px] mx-auto w-full">
          <div class="flex justify-center gap-2 flex-wrap sm:flex-nowrap">
            <Button 
              :label="'🔄 ' + (studyDirection === 'DE_TO_UA' ? 'DE' : 'UA')"
              unstyled
              :pt="settingsBtnPt"
              @click="studyDirection = studyDirection === 'DE_TO_UA' ? 'UA_TO_DE' : 'DE_TO_UA'"
            />
            <Button 
              :label="'🔊 ' + (isAutoplay ? 'On' : 'Off')"
              unstyled
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

          <div v-if="isFlipped" class="grid grid-cols-2 gap-3 mt-2">
            <Button label="🔴 AGAIN" unstyled :pt="srsBtnPt('#ff4d4d')" @click="updateSRS('again')" />
            <Button label="🟡 HARD" unstyled :pt="srsBtnPt('#ffcc00')" @click="updateSRS('hard')" />
            <Button label="🟢 GOOD" unstyled :pt="srsBtnPt('#33cc33')" @click="updateSRS('good')" />
            <Button label="🔵 EASY" unstyled :pt="srsBtnPt('#3399ff')" @click="updateSRS('easy')" />
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-[1fr,auto,1fr] items-center gap-3 mt-4">
            <Button label="⬅️" unstyled :pt="navBtnPt" @click="prevCard" />
            <div class="text-center font-bold text-lg text-white/90 whitespace-nowrap order-last sm:order-none col-span-2 sm:col-span-1 mt-1 sm:mt-0 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              {{ currentStudyIndex + 1 }} <span class="text-white/30 mx-1">/</span> {{ filteredVocabulary.length }}
            </div>
            <Button label="➡️" unstyled :pt="navBtnPt" @click="nextCard" />
          </div>
        </div>
      </main>

      <footer class="mt-20 pb-12 text-center text-[#94a3b8]">
        <p>Version <span id="app-version">v{{ appVersion }}</span></p>
      </footer>
    </div>
  </div>
</template>

<style>
/* base.css is already imported in main.css */
</style>
