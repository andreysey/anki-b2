<script setup lang="ts">
import { computed } from 'vue';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import {
  BookOpen,
  Sun,
  Moon,
  Monitor,
  Github,
  List,
  GraduationCap,
  BarChart3,
  Volume2
} from 'lucide-vue-next';

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
                :value="selectedVoiceURI"
                @change="emit('update:selectedVoiceURI', ($event.target as HTMLSelectElement).value)"
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
                :value="ttsRate"
                @input="emit('update:ttsRate', Number(($event.target as HTMLInputElement).value))"
                class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary block"
              />
            </div>
          </PopoverContent>
        </Popover>

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
        @click="emit('update:activeView', 'list')"
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
        @click="emit('update:activeView', 'study')"
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
        @click="emit('update:activeView', 'dashboard')"
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
              :value="selectedVoiceURI"
              @change="emit('update:selectedVoiceURI', ($event.target as HTMLSelectElement).value)"
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
              :value="ttsRate"
              @input="emit('update:ttsRate', Number(($event.target as HTMLInputElement).value))"
              class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary block"
            />
          </div>
        </PopoverContent>
      </Popover>

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
        <Github class="h-4 w-4" />
      </a>
    </div>
  </header>
</template>
