<script setup lang="ts">
import { computed } from 'vue';
import { Button } from './ui/button';
import AudioSettingsPopover from './AudioSettingsPopover.vue';
import {
  BookOpen,
  Sun,
  Moon,
  Monitor,
  List,
  GraduationCap,
  BarChart3
} from '@lucide/vue';

interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
}

const props = defineProps<{
  appVersion: string;
  activeView: 'list' | 'study' | 'dashboard';
  themeMode: 'light' | 'dark' | 'system';
  germanVoices: VoiceOption[];
  selectedVoiceURI: string;
  ttsRate: number;
}>();

const emit = defineEmits<{
  (e: 'update:activeView', view: 'list' | 'study' | 'dashboard'): void;
  (e: 'cycleTheme'): void;
  (e: 'update:selectedVoiceURI', uri: string): void;
  (e: 'update:ttsRate', rate: number): void;
}>();

const themeIcon = computed(() => {
  if (props.themeMode === 'light') return Sun;
  if (props.themeMode === 'dark') return Moon;
  return Monitor;
});

const themeModeLabel = computed(() => {
  if (props.themeMode === 'light') return 'Light';
  if (props.themeMode === 'dark') return 'Dark';
  return 'System';
});
</script>

<template>
  <header
    class="macos-titlebar relative px-4 sm:px-6 md:px-10 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 select-none shrink-0"
  >
    <!-- Scroll-driven Reading / Progress Bar (CSS Scroll Timeline) -->
    <div
      class="scroll-progress-bar absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500 pointer-events-none opacity-80"
    ></div>
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
        <AudioSettingsPopover
          idPrefix="mobile"
          buttonSize="icon-sm"
          :germanVoices="germanVoices"
          :selectedVoiceURI="selectedVoiceURI"
          :ttsRate="ttsRate"
          @update:selectedVoiceURI="emit('update:selectedVoiceURI', $event)"
          @update:ttsRate="emit('update:ttsRate', $event)"
        />

        <Button
          id="btn-theme-toggle-mobile"
          variant="ghost"
          size="icon-sm"
          @click="emit('cycleTheme')"
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
          <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
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
        @click="emit('update:activeView', 'list')"
      >
        <List class="h-3.5 w-3.5 shrink-0" />
        <span class="hidden xs:inline sm:inline">Dictionary</span>
        <span class="xs:hidden">Words</span>
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
        @click="emit('update:activeView', 'study')"
      >
        <GraduationCap class="h-3.5 w-3.5 shrink-0" />
        <span class="hidden sm:inline">Study Mode</span>
        <span class="sm:hidden">Study</span>
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
        @click="emit('update:activeView', 'dashboard')"
      >
        <BarChart3 class="h-3.5 w-3.5 shrink-0" />
        <span class="hidden xs:inline sm:inline">Dashboard</span>
        <span class="xs:hidden">Stats</span>
      </button>
    </nav>

    <!-- Right: Window Utility Actions (Desktop only) -->
    <div class="hidden md:flex items-center gap-2 justify-end">
      <!-- Audio Settings Popover (Desktop) -->
      <AudioSettingsPopover
        idPrefix="desktop"
        buttonSize="icon"
        :germanVoices="germanVoices"
        :selectedVoiceURI="selectedVoiceURI"
        :ttsRate="ttsRate"
        @update:selectedVoiceURI="emit('update:selectedVoiceURI', $event)"
        @update:ttsRate="emit('update:ttsRate', $event)"
      />

      <Button
        id="btn-theme-toggle"
        variant="ghost"
        size="icon"
        @click="emit('cycleTheme')"
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
        <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      </a>
    </div>
  </header>
</template>
