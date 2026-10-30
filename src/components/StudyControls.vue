<script setup lang="ts">
import { Button } from './ui/button';
import { Shuffle, Maximize2, Minimize2, Volume2, VolumeX } from '@lucide/vue';
import type { StudyDirection, SelectOption } from '../types';
import { useFullscreen } from '../composables/useFullscreen';

defineProps<{
  studyDirection: StudyDirection;
  isAutoplay: boolean;
  directionOptions: SelectOption<StudyDirection>[];
  audioOptions: SelectOption<boolean>[];
  isShuffled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:studyDirection', value: StudyDirection): void;
  (e: 'update:isAutoplay', value: boolean): void;
  (e: 'shuffle'): void;
}>();

const { isFullscreen, toggleFullscreen } = useFullscreen();

const segmentClass = (active: boolean) =>
  active
    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200';
</script>

<template>
  <div class="flex justify-between items-center w-full gap-2 flex-wrap">
    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Direction Segmented Toggle -->
      <div
        class="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs"
      >
        <button
          v-for="opt in directionOptions"
          :key="String(opt.value)"
          type="button"
          @click="emit('update:studyDirection', opt.value)"
          :class="[
            'px-1.5 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer text-xs whitespace-nowrap',
            segmentClass(studyDirection === opt.value)
          ]"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Audio Autoplay: icon toggle on phones, segmented control from sm -->
      <Button
        size="icon-sm"
        variant="outline"
        class="sm:hidden rounded-xl h-8 w-8 shadow-2xs"
        :aria-pressed="isAutoplay"
        :aria-label="isAutoplay ? 'Turn audio autoplay off' : 'Turn audio autoplay on'"
        :title="isAutoplay ? 'Audio autoplay on' : 'Audio autoplay off'"
        @click="emit('update:isAutoplay', !isAutoplay)"
      >
        <component :is="isAutoplay ? Volume2 : VolumeX" class="h-3.5 w-3.5" />
      </Button>
      <div
        class="hidden sm:flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-2xs"
      >
        <button
          v-for="opt in audioOptions"
          :key="String(opt.value)"
          type="button"
          @click="emit('update:isAutoplay', opt.value)"
          :class="[
            'px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer text-xs flex items-center gap-1',
            segmentClass(isAutoplay === opt.value)
          ]"
        >
          <span>{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <Button
        size="sm"
        variant="outline"
        @click="toggleFullscreen"
        :title="isFullscreen ? 'Exit Zen Mode (Fullscreen)' : 'Enter Zen Mode (Fullscreen)'"
        aria-label="Toggle Zen mode fullscreen"
        class="rounded-xl text-xs px-2 sm:px-2.5 shadow-2xs"
      >
        <component :is="isFullscreen ? Minimize2 : Maximize2" class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Zen</span>
      </Button>

      <Button
        size="sm"
        :variant="isShuffled ? 'default' : 'outline'"
        @click="emit('shuffle')"
        title="Shuffle cards"
        aria-label="Shuffle cards"
        class="rounded-xl text-xs px-2 sm:px-3 shadow-2xs shrink-0"
      >
        <Shuffle class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Shuffle</span>
      </Button>
    </div>
  </div>
</template>
