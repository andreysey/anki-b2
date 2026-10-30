<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import type { Word } from './types';
import { useVocabulary } from './composables/useVocabulary';
import { useTheme } from './composables/useTheme';
import { useSpeechSynthesis } from './composables/useSpeechSynthesis';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';
import { useNavigation } from './composables/useNavigation';
import { useAIAssistantState } from './composables/useAIAssistantState';
import { useWakeLock } from './composables/useWakeLock';
import { useStudyAutoplay } from './composables/useStudyAutoplay';
import { useStudyActions, DIRECTION_OPTIONS, AUDIO_OPTIONS } from './composables/useStudyActions';
import { useViewSync } from './composables/useViewSync';
import {
  useDueBadge,
  useBackupReminder,
  useCommandPaletteShortcut,
  usePersistOnFreeze
} from './composables/useAppLifecycle';
import { Loader2, AlertTriangle } from '@lucide/vue';

import AppHero from './components/AppHero.vue';
import AppHeader from './components/AppHeader.vue';
import FilterBar from './components/FilterBar.vue';
import VocabularyList from './components/VocabularyList.vue';

// Async Components (Code Splitting)
const Toaster = defineAsyncComponent(() => import('./components/ui/sonner/Sonner.vue'));
const StudyView = defineAsyncComponent(() => import('./components/StudyView.vue'));
const DashboardView = defineAsyncComponent(() => import('./components/DashboardView.vue'));
const AISettingsDialog = defineAsyncComponent(() => import('./components/AISettingsDialog.vue'));
const CommandPaletteModal = defineAsyncComponent(
  () => import('./components/CommandPaletteModal.vue')
);

const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.18.0';
const directionOptions = DIRECTION_OPTIONS;
const audioOptions = AUDIO_OPTIONS;

const isToasterMounted = ref(false);
const isCommandPaletteOpen = ref(false);
const mainContentRef = ref<HTMLElement | null>(null);

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
  nextCard,
  prevCard,
  shuffleCards,
  toggleMastered,
  restoreProgress,
  loadMore
} = useVocabulary();

const { themeMode, themeStyle, cycleTheme, toggleThemeStyle, initTheme, cleanupTheme } = useTheme();
const speech = useSpeechSynthesis();
const { germanVoices, selectedVoiceURI, ttsRate, playAudio, stopAudio } = speech;
const { activeView, setView, initNavigation, cleanupNavigation } = useNavigation();
const { isSettingsOpen } = useAIAssistantState();
const wakeLock = useWakeLock();

const study = useStudyActions();
const { studyProgress } = study;
const shortcuts = useKeyboardShortcuts({
  isStudyMode,
  isFlipped,
  onFlip: study.flip,
  onNext: nextCard,
  onPrev: prevCard,
  onToggleMastered: study.masterCurrentCard,
  onGrade: study.grade
});

useViewSync({
  mainContent: mainContentRef,
  stopAudio,
  requestWakeLock: wakeLock.requestWakeLock,
  releaseWakeLock: wakeLock.releaseWakeLock
});
useStudyAutoplay(speech);
useDueBadge();
useBackupReminder();
useCommandPaletteShortcut(isCommandPaletteOpen);
usePersistOnFreeze();

const handleSelectWordFromPalette = (word: Word) => {
  search.value = word.german;
  activeView.value = 'list';
};

onMounted(() => {
  initNavigation();
  init();
  initTheme();
  speech.initVoices();
  speech.warmupSpeech();
  shortcuts.register();
  // The toast library loads lazily on the first toast
  window.addEventListener('load-toaster', () => (isToasterMounted.value = true), { once: true });
});

onUnmounted(() => {
  stopAudio();
  wakeLock.cleanup();
  cleanupNavigation();
  cleanupTheme();
  shortcuts.cleanup();
});
</script>

<template>
  <Toaster v-if="isToasterMounted" position="top-right" rich-colors close-button />
  <AISettingsDialog v-if="isSettingsOpen" />

  <!-- macOS Ambient Desktop Wallpaper Canvas -->
  <div
    class="macos-desktop-bg min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-1.5 sm:p-6 lg:p-10 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-500"
  >
    <!-- Accessible Skip to Content Link -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white text-xs font-bold"
    >
      Skip to main content
    </a>

    <!-- Central macOS Floating Window -->
    <div
      class="macos-window w-full max-w-6xl rounded-2xl sm:rounded-[36px] overflow-hidden flex flex-col min-h-[96vh] sm:min-h-[90vh] my-auto"
    >
      <!-- macOS Window Titlebar & Toolbar -->
      <AppHeader
        v-model:selected-voice-u-r-i="selectedVoiceURI"
        v-model:tts-rate="ttsRate"
        :app-version="appVersion"
        :active-view="activeView"
        :theme-mode="themeMode"
        :theme-style="themeStyle"
        :german-voices="germanVoices"
        @update:active-view="setView"
        @cycle-theme="cycleTheme"
        @toggle-theme-style="toggleThemeStyle"
      />

      <!-- macOS Window Body Content -->
      <main
        id="main-content"
        ref="mainContentRef"
        tabindex="-1"
        class="macos-main-content flex-1 flex flex-col gap-5 sm:gap-6 overflow-y-auto custom-scrollbar focus:outline-none"
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
          v-model:search="search"
          v-model:level="levelFilter"
          v-model:thema="themaFilter"
          :vocabulary="vocabulary"
          :total-count="vocabulary.length"
          :filtered-count="filteredVocabulary.length"
          :is-study-mode="isStudyMode"
          @update:is-study-mode="activeView = $event ? 'study' : 'list'"
        />

        <!-- Dashboard View -->
        <DashboardView
          v-if="activeView === 'dashboard'"
          :vocabulary="vocabulary"
          :mastered-ids="masteredIds"
          :srs-data="srsData"
          :study-streak="studyStreak"
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
          v-model:study-direction="studyDirection"
          v-model:is-autoplay="isAutoplay"
          :vocabulary="studyList"
          :current-study-index="currentStudyIndex"
          :is-flipped="isFlipped"
          :study-progress="studyProgress"
          :direction-options="directionOptions"
          :audio-options="audioOptions"
          :is-shuffled="isShuffled"
          :session-reviewed-count="sessionReviewedCount"
          @shuffle="shuffleCards"
          @flip="study.flip"
          @update-srs="study.grade"
          @prev="prevCard"
          @next="nextCard"
          @toggle-mastered="toggleMastered"
          @play-audio="playAudio"
        />

        <!-- Vocabulary List View -->
        <VocabularyList
          v-else
          :vocabulary="filteredVocabulary"
          :display-limit="displayLimit"
          :mastered-ids="masteredIds"
          @toggle-mastered="toggleMastered"
          @play-audio="playAudio"
          @load-more="loadMore"
        />
      </main>
    </div>

    <!-- Command Palette (Cmd+K / Ctrl+K) -->
    <CommandPaletteModal
      v-model:is-open="isCommandPaletteOpen"
      :vocabulary="vocabulary"
      :mastered-ids="masteredIds"
      @select-word="handleSelectWordFromPalette"
      @play-audio="playAudio"
      @toggle-mastered="toggleMastered"
    />
  </div>
</template>
