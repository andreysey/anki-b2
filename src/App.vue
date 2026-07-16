<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue';
import { useVocabulary } from './composables/useVocabulary';
import FilterBar from './components/FilterBar.vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import BaseLayout from './components/BaseLayout.vue';
import AppHero from './components/AppHero.vue';
import VocabularyList from './components/VocabularyList.vue';
import StudyView from './components/StudyView.vue';
import DashboardView from './components/DashboardView.vue';
import Panel from 'primevue/panel';

const activeView = ref<'list' | 'study' | 'dashboard'>('list');

const {
  vocabulary,
  filteredVocabulary,
  studyList,
  search,
  levelFilter,
  themaFilter,
  isStudyMode,
  currentStudyIndex,
  isFlipped,
  studyDirection,
  isAutoplay,
  isShuffled,
  masteredIds,
  displayLimit,
  init,
  updateSRS,
  nextCard,
  prevCard,
  shuffleCards,
  toggleMastered,
  loadMore
} = useVocabulary();

// Sync isStudyMode and activeView
watch(activeView, (newView) => {
  isStudyMode.value = newView === 'study';
});

watch(isStudyMode, (studying) => {
  if (studying && activeView.value !== 'study') {
    activeView.value = 'study';
  } else if (!studying && activeView.value === 'study') {
    activeView.value = 'list';
  }
});

const toast = useToast();

const studyProgress = computed(() => {
  if (studyList.value.length === 0) return 0;
  return Math.round(((currentStudyIndex.value + 1) / studyList.value.length) * 100);
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
  
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }
  
  if (e.code === 'Space') {
    e.preventDefault();
    isFlipped.value = !isFlipped.value;
  } else if (e.code === 'ArrowRight') {
    nextCard();
  } else if (e.code === 'ArrowLeft') {
    prevCard();
  } else if (e.code === 'KeyM') {
    const currentCard = studyList.value[currentStudyIndex.value];
    if (currentCard) {
      toggleMastered(currentCard);
      toast.add({
        severity: 'success',
        summary: 'Mastered',
        detail: 'Word marked as mastered',
        life: 2000
      });
    }
  } else if (isFlipped.value) {
    if (e.key === '1') handleSRSUpdate('again');
    else if (e.key === '2') handleSRSUpdate('hard');
    else if (e.key === '3') handleSRSUpdate('good');
    else if (e.key === '4') handleSRSUpdate('easy');
  }
};

const germanVoices = ref<SpeechSynthesisVoice[]>([]);
const selectedVoiceURI = ref(localStorage.getItem('anki_tts_voice') || '');
const ttsRate = ref(Number(localStorage.getItem('anki_tts_rate') || '0.85'));

const loadVoices = () => {
  if ('speechSynthesis' in window) {
    germanVoices.value = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('de'));
    if (!selectedVoiceURI.value && germanVoices.value.length > 0) {
      // Prefer standard German voices if available
      const preferred = germanVoices.value.find(v => v.lang === 'de-DE') || germanVoices.value[0];
      selectedVoiceURI.value = preferred.voiceURI;
    }
  }
};

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

watch(selectedVoiceURI, (val) => {
  localStorage.setItem('anki_tts_voice', val);
});

watch(ttsRate, (val) => {
  localStorage.setItem('anki_tts_rate', String(val));
});

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = ttsRate.value;
    const voice = germanVoices.value.find(v => v.voiceURI === selectedVoiceURI.value);
    if (voice) {
      utterance.voice = voice;
    }
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
        <Button 
          icon="pi pi-chart-bar" 
          label="Dashboard" 
          :severity="activeView === 'dashboard' ? 'primary' : 'secondary'" 
          @click="activeView = 'dashboard'" 
        />
        <Button 
          icon="pi pi-list" 
          label="List" 
          :severity="activeView === 'list' ? 'primary' : 'secondary'" 
          @click="activeView = 'list'" 
        />
        <Button 
          icon="pi pi-graduation-cap" 
          label="Study" 
          :severity="activeView === 'study' ? 'primary' : 'secondary'" 
          @click="activeView = 'study'" 
        />
      </div>
    </template>

    <AppHero />

    <FilterBar 
      v-if="activeView !== 'dashboard'"
      :vocabulary="vocabulary"
      v-model:search="search"
      v-model:level="levelFilter"
      v-model:thema="themaFilter"
      v-model:isStudyMode="isStudyMode"
    />

    <!-- Audio Settings Panel -->
    <Panel v-if="activeView !== 'dashboard'" header="Audio Settings" toggleable collapsed class="shadow-xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        <div class="flex flex-col gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-400">German Voice</span>
          <select 
            v-model="selectedVoiceURI" 
            class="w-full bg-surface-900 border border-surface-800 text-surface-100 rounded-lg p-2.5 outline-none focus:border-primary-500"
          >
            <option v-for="voice in germanVoices" :key="voice.voiceURI" :value="voice.voiceURI">
              {{ voice.name }} ({{ voice.lang }})
            </option>
          </select>
        </div>
        <div class="flex flex-col gap-2 justify-center">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-400">Speed ({{ ttsRate }}x)</span>
          <input 
            type="range" 
            min="0.5" 
            max="1.5" 
            step="0.05" 
            v-model.number="ttsRate"
            class="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>
      </div>
    </Panel>

    <!-- Dashboard View -->
    <DashboardView 
      v-if="activeView === 'dashboard'"
      :vocabulary="vocabulary"
      :masteredIds="masteredIds"
    />

    <!-- Empty State -->
    <Message v-if="activeView !== 'dashboard' && filteredVocabulary.length === 0" severity="secondary" icon="pi pi-search" class="mb-12">
        No results found matching your current search or filter criteria. Try adjusting your filters.
    </Message>

    <!-- List View -->
    <VocabularyList 
      v-if="activeView === 'list' && filteredVocabulary.length > 0"
      :vocabulary="filteredVocabulary"
      :display-limit="displayLimit"
      @load-more="loadMore"
      @play-audio="playAudio"
      @toggle-mastered="toggleMastered"
    />

    <!-- Study Mode -->
    <StudyView 
      v-else-if="activeView === 'study' && studyList.length > 0"
      :vocabulary="studyList"
      :current-study-index="currentStudyIndex"
      :is-flipped="isFlipped"
      v-model:study-direction="studyDirection"
      v-model:is-autoplay="isAutoplay"
      :study-progress="studyProgress"
      :direction-options="directionOptions"
      :audio-options="audioOptions"
      :is-shuffled="isShuffled"
      @shuffle="shuffleCards"
      @flip="isFlipped = !isFlipped"
      @update-srs="handleSRSUpdate"
      @prev="prevCard"
      @next="nextCard"
      @toggle-mastered="toggleMastered"
      @play-audio="playAudio"
    />

    <Toast />
  </BaseLayout>
</template>

<style>
/* base.css is already imported in main.css */
</style>
