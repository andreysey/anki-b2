<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import type { StudyDirection, SelectOption } from './types';
import { useVocabulary } from './composables/useVocabulary';
import { useTheme } from './composables/useTheme';
import { useSpeechSynthesis } from './composables/useSpeechSynthesis';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';

// PrimeVue Components
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import Panel from 'primevue/panel';
import { useToast } from 'primevue/usetoast';

// App Components
import AppHero from './components/AppHero.vue';
import FilterBar from './components/FilterBar.vue';
import StudyView from './components/StudyView.vue';
import VocabularyList from './components/VocabularyList.vue';

// Async Components (Code Splitting)
const DashboardView = defineAsyncComponent(() => import('./components/DashboardView.vue'));

const toast = useToast();

// Domain State from Composables
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
  srsData,
  displayLimit,
  isLoading,
  error,
  init,
  updateSRS,
  nextCard,
  prevCard,
  shuffleCards,
  toggleMastered,
  restoreProgress,
  loadMore
} = useVocabulary();

const {
  themeMode,
  cycleTheme,
  initTheme,
  cleanupTheme
} = useTheme();

const themeIcon = computed(() => {
  if (themeMode.value === 'light') return 'pi pi-sun';
  if (themeMode.value === 'dark') return 'pi pi-moon';
  return 'pi pi-desktop';
});

const themeModeLabel = computed(() => {
  if (themeMode.value === 'light') return 'Light';
  if (themeMode.value === 'dark') return 'Dark';
  return 'System';
});

const {
  germanVoices,
  selectedVoiceURI,
  ttsRate,
  initVoices,
  playAudio
} = useSpeechSynthesis();

const activeView = ref<'list' | 'study' | 'dashboard'>('list');

// Synchronize activeView with isStudyMode
watch(activeView, (val) => {
  isStudyMode.value = (val === 'study');
});

const studyProgress = computed(() => {
  if (studyList.value.length === 0) return 0;
  return Math.round(((currentStudyIndex.value + 1) / studyList.value.length) * 100);
});

const directionOptions: SelectOption<StudyDirection>[] = [
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

const handleMasterCurrentCard = () => {
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
};

const shortcuts = useKeyboardShortcuts({
  isStudyMode,
  isFlipped,
  onFlip: () => { isFlipped.value = !isFlipped.value; },
  onNext: nextCard,
  onPrev: prevCard,
  onToggleMastered: handleMasterCurrentCard,
  onGrade: handleSRSUpdate
});

onMounted(() => {
  init();
  initTheme();
  initVoices();
  shortcuts.register();
});

onUnmounted(() => {
  cleanupTheme();
  shortcuts.cleanup();
});

watch([currentStudyIndex, isFlipped, isStudyMode, isAutoplay], ([newIdx, newFlipped, studying, autoplay]) => {
  if (!studying || !autoplay) return;
  const currentCard = studyList.value[newIdx];
  if (!currentCard) return;

  if (studyDirection.value === 'DE_TO_UA') {
    if (!newFlipped) {
      playAudio(currentCard.german_audio || currentCard.german);
    } else if (currentCard.example) {
      playAudio(currentCard.example);
    }
  } else {
    if (newFlipped) {
      playAudio(currentCard.german_audio || currentCard.german);
    }
  }
});
</script>

<template>
  <Toast />
  <div class="min-h-screen bg-surface-950 text-surface-0 flex flex-col items-center p-4 sm:p-8 font-sans selection:bg-primary selection:text-white">
    <!-- Header Controls -->
    <header class="w-full max-w-6xl flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <i class="pi pi-book text-3xl text-primary animate-pulse"></i>
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-surface-100 bg-clip-text text-transparent">
          Anki B2
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <Button 
          :icon="themeIcon" 
          severity="secondary" 
          rounded 
          outlined 
          @click="cycleTheme" 
          :title="`Theme: ${themeModeLabel}`"
        />
        <a 
          href="https://github.com/andreysey/anki-b2" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="GitHub Repository"
          class="p-button p-component p-button-icon-only p-button-secondary p-button-rounded p-button-outlined"
        >
          <i class="pi pi-github text-xl"></i>
        </a>
      </div>
    </header>

    <!-- Main Container -->
    <main class="w-full max-w-6xl flex flex-col gap-6">
      <!-- Navigation View Tabs -->
      <div class="flex justify-center gap-3 bg-surface-900/60 p-1.5 rounded-2xl border border-surface-800/80 w-fit mx-auto shadow-inner">
        <Button 
          label="Dictionary" 
          icon="pi pi-list" 
          size="small" 
          :text="activeView !== 'list'" 
          :severity="activeView === 'list' ? 'primary' : 'secondary'" 
          @click="activeView = 'list'" 
        />
        <Button 
          label="Study Mode" 
          icon="pi pi-graduation-cap" 
          size="small" 
          :text="activeView !== 'study'" 
          :severity="activeView === 'study' ? 'primary' : 'secondary'" 
          @click="activeView = 'study'" 
        />
        <Button 
          label="Dashboard" 
          icon="pi pi-chart-bar" 
          size="small" 
          :text="activeView !== 'dashboard'" 
          :severity="activeView === 'dashboard' ? 'primary' : 'secondary'" 
          @click="activeView = 'dashboard'" 
        />
      </div>

      <AppHero />

      <!-- Error State -->
      <Message v-if="error" severity="error" icon="pi pi-exclamation-triangle" class="mb-6">
        {{ error }}
      </Message>

      <FilterBar 
        v-if="activeView !== 'dashboard'"
        :vocabulary="vocabulary"
        v-model:search="search"
        v-model:level="levelFilter"
        v-model:thema="themaFilter"
        :isStudyMode="isStudyMode"
        @update:isStudyMode="activeView = $event ? 'study' : 'list'"
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
          <div class="flex flex-col gap-2 justify-center min-h-[60px]">
            <span class="text-xs font-bold uppercase tracking-wider text-surface-400">Speed ({{ ttsRate }}x)</span>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.05" 
              v-model.number="ttsRate"
              class="w-full h-2 bg-surface-700 rounded-lg cursor-pointer accent-primary-500 block style-range-slider"
              style="appearance: auto; -webkit-appearance: auto;"
            />
          </div>
        </div>
      </Panel>

      <!-- Dashboard View -->
      <DashboardView 
        v-if="activeView === 'dashboard'"
        :vocabulary="vocabulary"
        :masteredIds="masteredIds"
        :srsData="srsData"
        @restore-progress="restoreProgress($event.masteredIds, $event.srsData)"
      />

      <!-- Loading State -->
      <div v-else-if="isLoading" class="flex justify-center my-12">
        <ProgressSpinner />
      </div>

      <!-- Study Mode View -->
      <StudyView 
        v-else-if="activeView === 'study'"
        :vocabulary="studyList"
        :currentStudyIndex="currentStudyIndex"
        :isFlipped="isFlipped"
        v-model:studyDirection="studyDirection"
        v-model:isAutoplay="isAutoplay"
        :studyProgress="studyProgress"
        :directionOptions="directionOptions"
        :audioOptions="audioOptions"
        :isShuffled="isShuffled"
        @shuffle="shuffleCards"
        @flip="isFlipped = !isFlipped"
        @update-srs="handleSRSUpdate"
        @prev="prevCard"
        @next="nextCard"
        @toggle-mastered="toggleMastered"
        @play-audio="playAudio"
      />

      <!-- Vocabulary List View -->
      <VocabularyList 
        v-else
        :vocabulary="filteredVocabulary"
        :displayLimit="displayLimit"
        :masteredIds="masteredIds"
        @toggle-mastered="toggleMastered"
        @play-audio="playAudio"
        @load-more="loadMore"
      />
    </main>
  </div>
</template>
