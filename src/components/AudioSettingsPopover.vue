<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Button } from './ui/button';
import { Volume2, X } from 'lucide-vue-next';

interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
}

defineProps<{
  idPrefix: string;
  buttonSize?: 'icon' | 'icon-sm';
  germanVoices: VoiceOption[];
  selectedVoiceURI: string;
  ttsRate: number;
}>();

const emit = defineEmits<{
  (e: 'update:selectedVoiceURI', uri: string): void;
  (e: 'update:ttsRate', rate: number): void;
}>();

const isOpen = ref(false);
const popoverRef = ref<HTMLElement | null>(null);

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="relative" ref="popoverRef">
    <Button
      :id="`btn-audio-settings-${idPrefix}`"
      variant="ghost"
      :size="buttonSize || 'icon'"
      title="Speech & Audio Preferences"
      class="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      @click.stop="toggleOpen"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
    >
      <Volume2 class="h-4 w-4" />
    </Button>

    <div
      v-if="isOpen"
      role="dialog"
      aria-label="Speech & Audio Preferences"
      class="absolute right-0 top-full mt-2 w-80 p-4 space-y-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div class="flex items-center gap-2">
          <Volume2 class="h-4 w-4 text-primary" />
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200">Speech & Audio Preferences</span>
        </div>
        <button
          type="button"
          @click="isOpen = false"
          class="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close preferences"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="space-y-2">
        <label
          :for="`voice-select-${idPrefix}`"
          class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block"
        >
          German Voice Engine
        </label>
        <select
          :id="`voice-select-${idPrefix}`"
          aria-label="Select German Voice Engine"
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
          <label :for="`tts-rate-${idPrefix}`">Speech Rate</label>
          <span class="font-mono text-primary">{{ ttsRate }}x</span>
        </div>
        <input
          :id="`tts-rate-${idPrefix}`"
          aria-label="Speech Rate"
          type="range"
          min="0.5"
          max="1.5"
          step="0.05"
          :value="ttsRate"
          @input="emit('update:ttsRate', Number(($event.target as HTMLInputElement).value))"
          class="w-full h-2 bg-slate-300 dark:bg-white/20 rounded-lg cursor-pointer accent-primary block"
        />
      </div>
    </div>
  </div>
</template>
