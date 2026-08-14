<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent, nextTick } from 'vue';
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
import AISettingsDialog from './components/AISettingsDialog.vue';

// Async Components (Code Splitting)
const DashboardView = defineAsyncComponent(() => import('./components/DashboardView.vue'));

const toast = useToast();
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

const { germanVoices, selectedVoiceURI, ttsRate, initVoices, playAudio } = useSpeechSynthesis();

const activeView = ref<'list' | 'study' | 'dashboard'>('list');

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
  { label: 'DE', value: 'DE_TO_UA' },
  { label: 'UA', value: 'UA_TO_DE' }
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
  onFlip: () => {
    isFlipped.value = !isFlipped.value;
  },
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

watch(
  [currentStudyIndex, isFlipped, isStudyMode, isAutoplay],
  ([newIdx, newFlipped, studying, autoplay]) => {
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
  }
);
</script>

<template>
  <Toast />
  <AISettingsDialog />

  <!-- macOS Ambient Desktop Wallpaper Canvas -->
  <div
    class="macos-desktop-bg min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 lg:p-12 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-500"
  >
    <!-- Central macOS Floating Window -->
    <div
      class="macos-window w-full max-w-6xl rounded-[28px] sm:rounded-[36px] overflow-hidden flex flex-col min-h-[90vh] my-auto"
    >
      <!-- macOS Window Titlebar & Toolbar -->
      <header
        class="macos-titlebar px-4 sm:px-6 md:px-10 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 select-none shrink-0"
      >
        <!-- Top row on mobile: Logo + Title (Left) & Utility Actions (Right) -->
        <div class="flex items-center justify-between w-full md:w-auto gap-3">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <div
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 dark:text-primary-400 shadow-xs shrink-0"
            >
              <i class="pi pi-book text-sm sm:text-base"></i>
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span
                class="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-200"
                >Anki B2</span
              >
              <span
                class="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 shadow-2xs"
              >
                v{{ appVersion }}
              </span>
            </div>
          </div>

          <!-- Utility Actions (Mobile only) -->
          <div class="flex md:hidden items-center gap-1.5">
            <Button
              id="btn-theme-toggle-mobile"
              :icon="themeIcon"
              severity="secondary"
              rounded
              text
              size="small"
              @click="cycleTheme"
              :title="`Theme: ${themeModeLabel}`"
              class="hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all !w-8 !h-8"
            />
            <a
              href="https://github.com/andreysey/anki-b2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              class="p-button p-component p-button-icon-only p-button-secondary p-button-rounded p-button-text !w-8 !h-8 hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <i class="pi pi-github text-sm"></i>
            </a>
          </div>
        </div>

        <!-- Center: macOS Segmented Navigation Pill -->
        <nav
          class="macos-segmented-bar w-full md:w-auto grid grid-cols-3 md:flex items-center gap-1 shadow-inner p-1"
        >
          <button
            type="button"
            id="tab-dictionary"
            class="px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center"
            :class="
              activeView === 'list'
                ? 'macos-segmented-item-active'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            "
            @click="activeView = 'list'"
          >
            <i class="pi pi-list text-xs"></i>
            <span>Dictionary</span>
          </button>
          <button
            type="button"
            id="tab-study"
            class="px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center"
            :class="
              activeView === 'study'
                ? 'macos-segmented-item-active'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            "
            @click="activeView = 'study'"
          >
            <i class="pi pi-graduation-cap text-xs"></i>
            <span>Study Mode</span>
          </button>
          <button
            type="button"
            id="tab-dashboard"
            class="px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 text-center"
            :class="
              activeView === 'dashboard'
                ? 'macos-segmented-item-active'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            "
            @click="activeView = 'dashboard'"
          >
            <i class="pi pi-chart-bar text-xs"></i>
            <span>Dashboard</span>
          </button>
        </nav>

        <!-- Right: Window Utility Actions (Desktop only) -->
        <div class="hidden md:flex items-center gap-2 justify-end">
          <Button
            id="btn-theme-toggle"
            :icon="themeIcon"
            severity="secondary"
            rounded
            text
            size="small"
            @click="cycleTheme"
            :title="`Theme: ${themeModeLabel}`"
            class="hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all !w-9 !h-9"
          />
          <a
            href="https://github.com/andreysey/anki-b2"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            class="p-button p-component p-button-icon-only p-button-secondary p-button-rounded p-button-text !w-9 !h-9 hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <i class="pi pi-github text-base"></i>
          </a>
        </div>
      </header>

      <!-- macOS Window Body Content -->
      <main
        ref="mainContentRef"
        class="macos-main-content flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar"
      >
        <AppHero v-if="activeView === 'list'" />

        <!-- Error Banner -->
        <Message
          v-if="error"
          severity="error"
          icon="pi pi-exclamation-triangle"
          class="!rounded-xl mb-4"
        >
          {{ error }}
        </Message>

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

        <!-- Audio Settings Panel -->
        <Panel
          v-if="activeView === 'list'"
          header="Speech & Audio Preferences"
          toggleable
          collapsed
          class="shadow-sm !rounded-2xl border border-slate-200/80 dark:border-white/10"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
            <div class="flex flex-col gap-2">
              <span
                class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >German Voice Engine</span
              >
              <select
                v-model="selectedVoiceURI"
                class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-xs sm:text-sm outline-none focus:border-primary-500"
              >
                <option v-for="voice in germanVoices" :key="voice.voiceURI" :value="voice.voiceURI">
                  {{ voice.name }} ({{ voice.lang }})
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-2 justify-center min-h-[60px]">
              <span
                class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >Speech Rate ({{ ttsRate }}x)</span
              >
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                v-model.number="ttsRate"
                class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary-500 block"
                style="appearance: auto; -webkit-appearance: auto"
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
          :studyStreak="studyStreak"
          @restore-progress="restoreProgress($event.masteredIds, $event.srsData)"
        />

        <!-- Loading State -->
        <div v-else-if="isLoading" class="flex justify-center my-16">
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
