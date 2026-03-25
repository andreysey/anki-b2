<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';
import Button from 'primevue/button';

const props = defineProps<{
  word: Word;
  isFlipped: boolean;
  direction: StudyDirection;
}>();

const emit = defineEmits(['flip']);

const playAudio = (text: string) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
};

const showGermanOnFront = computed(() => props.direction === 'DE_TO_UA');

const ttsButtonPt = {
  root: 'bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all hover:bg-[#00d2ff] hover:text-[#0f172a] hover:scale-110 active:scale-95'
};
</script>

<template>
  <div class="scene w-full max-w-[500px] h-[320px] sm:h-[350px] perspective-[1000px] cursor-pointer mx-auto" @click="emit('flip')">
    <div class="study-card relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]" :class="{ '[transform:rotateY(180deg)]': isFlipped }">
      <!-- Front -->
      <div class="study-card-face study-card-front glass absolute w-full h-full [backface-visibility:hidden] flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-[24px]">
        <template v-if="showGermanOnFront">
          <div class="flex flex-col items-center gap-6">
            <h2 class="text-2xl sm:text-4xl font-bold leading-tight text-white" v-html="word.german"></h2>
            <Button 
              label="🔊"
              @click.stop="playAudio(word.german_audio)" 
              unstyled 
              :pt="ttsButtonPt"
              title="Play pronunciation"
            />
          </div>
          <div class="mt-8 text-sm opacity-50 font-medium tracking-wide uppercase">Thema {{ word.thema }}</div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center gap-2">
            <div class="text-2xl sm:text-3xl font-bold text-white leading-tight">{{ word.ukrainian }}</div>
            <div class="text-lg sm:text-xl text-[#94a3b8] font-medium opacity-80">{{ word.english }}</div>
          </div>
          <div class="mt-8 text-sm opacity-50 font-medium tracking-wide uppercase">Thema {{ word.thema }}</div>
        </template>
      </div>

      <!-- Back -->
      <div class="study-card-face study-card-back glass absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-[24px]">
        <template v-if="showGermanOnFront">
          <div class="flex flex-col items-center gap-3">
            <div class="text-2xl sm:text-3xl font-bold text-white leading-tight">{{ word.ukrainian }}</div>
            <div class="text-lg sm:text-xl text-[#94a3b8] font-medium">{{ word.english }}</div>
          </div>
          <div v-if="word.example" class="mt-8 pt-6 border-t border-white/10 italic text-[#cbd5e1] text-[1.05rem] leading-relaxed max-w-[90%]" v-html="word.example"></div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center gap-6">
            <h2 class="text-2xl sm:text-4xl font-bold leading-tight text-white" v-html="word.german"></h2>
            <Button 
              label="🔊"
              @click.stop="playAudio(word.german_audio)" 
              unstyled 
              :pt="ttsButtonPt"
              title="Play pronunciation"
            />
          </div>
          <div v-if="word.example" class="mt-8 pt-6 border-t border-white/10 italic text-[#cbd5e1] text-[1.05rem] leading-relaxed max-w-[90%]" v-html="word.example"></div>
        </template>
      </div>
    </div>
  </div>
</template>
