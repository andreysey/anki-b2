<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent, nextTick } from 'vue';
import type { StudyDirection, SelectOption } from './types';
import { useVocabulary } from './composables/useVocabulary';
import { useTheme } from './composables/useTheme';
import { useSpeechSynthesis } from './composables/useSpeechSynthesis';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';

// UI Components
import { Button } from './components/ui/button';
import { Toaster, toast } from './components/ui/sonner';
import { Popover, PopoverTrigger, PopoverContent } from './components/ui/popover';
import {
  BookOpen,
  Sun,
  Moon,
  Monitor,
  Github,
  List,
  GraduationCap,
  BarChart3,
  Loader2,
  AlertTriangle,
  Volume2
} from 'lucide-vue-next';

// App Components
import AppHero from './components/AppHero.vue';
import FilterBar from './components/FilterBar.vue';
import StudyView from './components/StudyView.vue';
import VocabularyList from './components/VocabularyList.vue';
import AISettingsDialog from './components/AISettingsDialog.vue';

// Async Components (Code Splitting)
const DashboardView = defineAsyncComponent(() => import('./components/DashboardView.vue'));

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
  if (themeMode.value === 'light') return Sun;
  if (themeMode.value === 'dark') return Moon;
  return Monitor;
});

const themeModeLabel = computed(() => {
  if (themeMode.value === 'light') return 'Light';
  if (themeMode.value === 'dark') return 'Dark';
  return 'System';
});

const { germanVoices, selectedVoiceURI, ttsRate, initVoices, playAudio, playSequence } =
  useSpeechSynthesis();

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
              <BookOpen class="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span
                class="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-200"
              >
                Anki B2
              </span>
              <span
                class="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 shadow-2xs"
              >
                v{{ appVersion }}
              </span>
            </div>
          </div>

          <!-- Utility Actions (Mobile only) -->
          <div class="flex md:hidden items-center gap-1.5">
            <!-- Audio Settings Popover (Mobile) -->
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  id="btn-audio-settings-mobile"
                  variant="ghost"
                  size="icon-sm"
                  title="Speech & Audio Preferences"
                  class="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <Volume2 class="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-80 p-4 space-y-4" align="end">
                <div class="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
                  <Volume2 class="h-4 w-4 text-primary" />
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Speech & Audio Preferences</span>
                </div>
                <div class="space-y-2">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    German Voice Engine
                  </span>
                  <select
                    v-model="selectedVoiceURI"
                    class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl p-2 text-xs outline-none focus:border-primary"
                  >
                    <option v-for="voice in germanVoices" :key="voice.voiceURI" :value="voice.voiceURI">
                      {{ voice.name }} ({{ voice.lang }})
                    </option>
                  </select>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span>Speech Rate</span>
                    <span class="font-mono text-primary">{{ ttsRate }}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    v-model.number="ttsRate"
                    class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary block"
                    style="appearance: auto; -webkit-appearance: auto"
                  />
                </div>
              </PopoverContent>
            </Popover>

            <Button
              id="btn-theme-toggle-mobile"
              variant="ghost"
              size="icon-sm"
              @click="cycleTheme"
              :title="`Theme: ${themeModeLabel}`"
              class="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <component :is="themeIcon" class="h-4 w-4" />
            </Button>
            <a
              href="https://github.com/andreysey/anki-b2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              class="inline-flex items-center justify-center rounded-full h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all"
            >
              <Github class="h-4 w-4" />
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
            <List class="h-3.5 w-3.5" />
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
            <GraduationCap class="h-3.5 w-3.5" />
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
            <BarChart3 class="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
        </nav>

        <!-- Right: Window Utility Actions (Desktop only) -->
        <div class="hidden md:flex items-center gap-2 justify-end">
          <!-- Audio Settings Popover (Desktop) -->
          <Popover>
            <PopoverTrigger as-child>
              <Button
                id="btn-audio-settings"
                variant="ghost"
                size="icon"
                title="Speech & Audio Preferences"
                class="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                <Volume2 class="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-4 space-y-4" align="end">
              <div class="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
                <Volume2 class="h-4 w-4 text-primary" />
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Speech & Audio Preferences</span>
              </div>
              <div class="space-y-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  German Voice Engine
                </span>
                <select
                  v-model="selectedVoiceURI"
                  class="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-xl p-2 text-xs sm:text-sm outline-none focus:border-primary"
                >
                  <option v-for="voice in germanVoices" :key="voice.voiceURI" :value="voice.voiceURI">
                    {{ voice.name }} ({{ voice.lang }})
                  </option>
                </select>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Speech Rate</span>
                  <span class="font-mono text-primary">{{ ttsRate }}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  v-model.number="ttsRate"
                  class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary block"
                  style="appearance: auto; -webkit-appearance: auto"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Button
            id="btn-theme-toggle"
            variant="ghost"
            size="icon"
            @click="cycleTheme"
            :title="`Theme: ${themeModeLabel}`"
            class="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <component :is="themeIcon" class="h-4 w-4" />
          </Button>
          <a
            href="https://github.com/andreysey/anki-b2"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            class="inline-flex items-center justify-center rounded-full h-9 w-9 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all"
          >
            <Github class="h-4 w-4" />
          </a>
        </div>
      </header>

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
