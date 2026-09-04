<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent, nextTick } from 'vue';
import type { StudyDirection, SelectOption } from './types';
import { useVocabulary } from './composables/useVocabulary';
import { useTheme } from './composables/useTheme';
import { useSpeechSynthesis } from './composables/useSpeechSynthesis';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';
import { useNavigation } from './composables/useNavigation';
import { useAIAssistantState } from './composables/useAIAssistantState';

// UI Components
import { Toaster, toast } from './components/ui/sonner';
import { Loader2, AlertTriangle } from 'lucide-vue-next';

// App Components
import AppHero from './components/AppHero.vue';
import AppHeader from './components/AppHeader.vue';
import FilterBar from './components/FilterBar.vue';
import StudyView from './components/StudyView.vue';
import VocabularyList from './components/VocabularyList.vue';

// Async Components (Code Splitting)
const DashboardView = defineAsyncComponent(() => import('./components/DashboardView.vue'));
const AISettingsDialog = defineAsyncComponent(() => import('./components/AISettingsDialog.vue'));

const mainContentRef = ref<HTMLElement | null>(null);
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.18.0';

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
  studyStreak,
  sessionReviewedCount,
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

const { themeMode, cycleTheme, initTheme, cleanupTheme } = useTheme();

const { germanVoices, selectedVoiceURI, ttsRate, initVoices, playAudio, playSequence } =
  useSpeechSynthesis();

const { activeView, initNavigation, cleanupNavigation } = useNavigation();
const { isSettingsOpen } = useAIAssistantState();

// Synchronize activeView with isStudyMode bidirectionally and reset scroll
watch(activeView, async (val) => {
  isStudyMode.value = val === 'study';
  await nextTick();
  if (mainContentRef.value) {
    mainContentRef.value.scrollTop = 0;
  }
});

watch(isStudyMode, (val) => {
  if (val && activeView.value !== 'study') {
    activeView.value = 'study';
  } else if (!val && activeView.value === 'study') {
    activeView.value = 'list';
  }
});

const studyProgress = computed(() => {
  if (studyList.value.length === 0) return 0;
  return Math.round(((currentStudyIndex.value + 1) / studyList.value.length) * 100);
});

const directionOptions: SelectOption<StudyDirection>[] = [
  { label: 'DE → EN/UA', value: 'DE_TO_UA' },
  { label: 'EN/UA → DE', value: 'UA_TO_DE' }
];

const audioOptions = [
  { label: 'Audio On', value: true },
  { label: 'Audio Off', value: false }
];

const handleSRSUpdate = (severity: 'again' | 'hard' | 'good' | 'easy') => {
  updateSRS(severity);
  const labels: Record<string, string> = {
    again: 'Again',
    hard: 'Hard',
    good: 'Good',
    easy: 'Easy'
  };

  if (severity === 'again') {
    toast.error(`Graded: ${labels[severity]}`);
  } else if (severity === 'hard') {
    toast.warning(`Graded: ${labels[severity]}`);
  } else if (severity === 'good') {
    toast.success(`Graded: ${labels[severity]}`);
  } else {
    toast.info(`Graded: ${labels[severity]}`);
  }
};

const handleMasterCurrentCard = () => {
  const currentCard = studyList.value[currentStudyIndex.value];
  if (currentCard) {
    toggleMastered(currentCard);
    toast.success('Word marked as mastered');
  }
};

const shortcuts = useKeyboardShortcuts({
  isStudyMode,
  isFlipped,
  onFlip: () => {
    isFlipped.value = !isFlipped.value;
  },
  onNext: nextCard,
  onPrev: prevCard,
  onToggleMastered: handleMasterCurrentCard,
  onGrade: handleSRSUpdate
});

onMounted(() => {
  initNavigation();
  init();
  initTheme();
  initVoices();
  shortcuts.register();
});

onUnmounted(() => {
  cleanupNavigation();
  cleanupTheme();
  shortcuts.cleanup();
});

watch(
  [currentStudyIndex, isFlipped, isStudyMode, isAutoplay],
  ([newIdx, newFlipped, studying, autoplay]) => {
    if (!studying || !autoplay) return;
    const currentCard = studyList.value[newIdx];
    if (!currentCard) return;

    if (studyDirection.value === 'DE_TO_UA') {
      if (!newFlipped) {
        // Front: German word
        playAudio(currentCard.german_audio || currentCard.german, 'de-DE');
      } else {
        // Back: English translation -> German example sentence
        const items: Array<{ text: string; lang?: string }> = [
          { text: currentCard.english, lang: 'en-US' }
        ];
        if (currentCard.example) {
          items.push({ text: currentCard.example, lang: 'de-DE' });
        }
        playSequence(items);
      }
    } else {
      if (!newFlipped) {
        // Front: English word
        playAudio(currentCard.english, 'en-US');
      } else {
        // Back: German word -> German example sentence
        const items: Array<{ text: string; lang?: string }> = [
          { text: currentCard.german_audio || currentCard.german, lang: 'de-DE' }
        ];
        if (currentCard.example) {
          items.push({ text: currentCard.example, lang: 'de-DE' });
        }
        playSequence(items);
      }
    }
  }
);
</script>

<template>
  <Toaster position="top-right" richColors />
  <AISettingsDialog v-if="isSettingsOpen" />

  <!-- macOS Ambient Desktop Wallpaper Canvas -->
  <div
    class="macos-desktop-bg min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-1.5 sm:p-6 lg:p-10 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-500"
  >
    <!-- Central macOS Floating Window -->
    <div
      class="macos-window w-full max-w-6xl rounded-2xl sm:rounded-[36px] overflow-hidden flex flex-col min-h-[96vh] sm:min-h-[90vh] my-auto"
    >
      <!-- macOS Window Titlebar & Toolbar -->
      <AppHeader
        :appVersion="appVersion"
        v-model:activeView="activeView"
        :themeMode="themeMode"
        :germanVoices="germanVoices"
        v-model:selectedVoiceURI="selectedVoiceURI"
        v-model:ttsRate="ttsRate"
        @cycleTheme="cycleTheme"
      />

      <!-- macOS Window Body Content -->
      <main
        ref="mainContentRef"
        class="macos-main-content flex-1 flex flex-col gap-5 sm:gap-6 overflow-y-auto custom-scrollbar"
      >
        <AppHero v-if="activeView === 'list'" />

        <!-- Error Banner -->
        <div
          v-if="error"
          class="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-medium mb-4"
        >
          <AlertTriangle class="h-4 w-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Filter Bar (Dictionary View) -->
        <FilterBar
          v-if="activeView === 'list'"
          :vocabulary="vocabulary"
          :totalCount="vocabulary.length"
          :filteredCount="filteredVocabulary.length"
          v-model:search="search"
          v-model:level="levelFilter"
          v-model:thema="themaFilter"
          :isStudyMode="isStudyMode"
          @update:isStudyMode="activeView = $event ? 'study' : 'list'"
        />

        <!-- Dashboard View -->
        <DashboardView
          v-if="activeView === 'dashboard'"
          :vocabulary="vocabulary"
          :masteredIds="masteredIds"
          :srsData="srsData"
          :studyStreak="studyStreak"
          @restore-progress="restoreProgress($event.masteredIds, $event.srsData)"
        />

        <!-- Loading State -->
        <div v-else-if="isLoading" class="flex flex-col items-center justify-center my-16 gap-3">
          <Loader2 class="h-8 w-8 text-primary-500 animate-spin" />
          <span class="text-xs text-slate-500 font-medium">Loading vocabulary...</span>
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
          :sessionReviewedCount="sessionReviewedCount"
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
  </div>
</template>
