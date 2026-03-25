<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel';
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

const badgePt = {
  root: 'px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.15em] rounded-lg border shadow-lg backdrop-blur-md transition-all'
};

const cardPt = {
  root: 'glass absolute w-full h-full [backface-visibility:hidden] flex flex-col p-10 sm:p-14 text-center rounded-[32px] border border-white/10 overflow-hidden transition-all',
  body: 'p-0 h-full flex flex-col',
  content: 'flex-1 flex flex-col h-full overflow-hidden'
};

const scrollPanelPt = {
  root: 'flex-1 flex flex-col h-full mini-scroll',
  content: 'flex flex-col items-center justify-center min-h-full py-4',
  barY: 'bg-white/10 rounded-full w-1'
};

const dividerPt = {
  root: 'my-6 sm:my-8 border-white/5'
};

const ttsButtonPt = {
  root: 'bg-[#00d2ff]/10 border border-[#00d2ff]/20 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all hover:bg-[#00d2ff] hover:text-[#0f172a] hover:scale-110 active:scale-95'
};
</script>

<template>
  <div class="w-full max-w-[550px] h-[350px] xs:h-[380px] sm:h-[420px] [perspective:1500px] cursor-pointer mx-auto group" @click="emit('flip')">
    <div class="relative w-full h-full transition-all duration-[800ms] [transform-style:preserve-3d] shadow-2xl rounded-[32px]" :class="{ '[transform:rotateY(180deg)]': isFlipped }">
      <!-- Front -->
      <Card unstyled :pt="cardPt">
        <template #header>
          <div class="absolute top-6 left-8 right-8 flex justify-between items-center z-20">
            <Badge :value="word.level" unstyled :pt="badgePt" class="!bg-[#00d2ff]/20 !border-[#00d2ff]/30 !text-[#00d2ff]" />
            <Badge :value="'Thema ' + word.thema" unstyled :pt="badgePt" class="!bg-white/5 !border-white/10 !text-white/50" />
          </div>
        </template>
        <template #content>
          <ScrollPanel unstyled :pt="scrollPanelPt">
            <template v-if="showGermanOnFront">
              <div class="flex flex-col items-center gap-8 sm:gap-10 w-full">
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white break-words w-full px-2 mt-4" style="hyphens: auto;" v-html="word.german"></h2>
                <Button 
                  label="🔊"
                  @click.stop="playAudio(word.german_audio)" 
                  unstyled 
                  :pt="ttsButtonPt"
                  title="Play pronunciation"
                />
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center gap-4 w-full">
                <div class="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight break-words w-full">{{ word.ukrainian }}</div>
                <div class="text-lg sm:text-xl text-[#94a3b8] font-bold opacity-60 tracking-wide">{{ word.english }}</div>
              </div>
            </template>
          </ScrollPanel>
        </template>
      </Card>

      <!-- Back -->
      <Card unstyled :pt="{ 
        ...cardPt, 
        root: [cardPt.root, '[transform:rotateY(180deg)] !border-[#00d2ff]/20 !bg-gradient-to-br !from-[#00d2ff]/5 !to-transparent'] 
      }">
        <template #header>
          <div class="absolute top-6 left-8 right-8 flex justify-between items-center z-20">
            <Badge :value="word.level" unstyled :pt="badgePt" class="!bg-[#00d2ff]/20 !border-[#00d2ff]/30 !text-[#00d2ff]" />
            <Badge :value="'Thema ' + word.thema" unstyled :pt="badgePt" class="!bg-white/5 !border-white/10 !text-white/50" />
          </div>
        </template>
        <template #content>
          <ScrollPanel unstyled :pt="scrollPanelPt">
            <template v-if="showGermanOnFront">
              <div class="flex flex-col items-center gap-6 w-full">
                <div class="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight break-words w-full">{{ word.ukrainian }}</div>
                <div class="text-lg sm:text-xl text-[#94a3b8] font-bold tracking-wide">{{ word.english }}</div>
              </div>
              <template v-if="word.example">
                <Divider unstyled :pt="dividerPt" />
                <div class="italic text-[#cbd5e1] text-[0.95rem] sm:text-[1.15rem] leading-relaxed max-w-[95%] opacity-90" v-html="word.example"></div>
              </template>
            </template>
            <template v-else>
              <div class="flex flex-col items-center gap-8 sm:gap-10 w-full">
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white break-words w-full px-2" style="hyphens: auto;" v-html="word.german"></h2>
                <Button 
                  label="🔊"
                  @click.stop="playAudio(word.german_audio)" 
                  unstyled 
                  :pt="ttsButtonPt"
                  title="Play pronunciation"
                />
              </div>
              <template v-if="word.example">
                <Divider unstyled :pt="dividerPt" />
                <div class="italic text-[#cbd5e1] text-[0.95rem] sm:text-[1.15rem] leading-relaxed max-w-[95%] opacity-90" v-html="word.example"></div>
              </template>
            </template>
          </ScrollPanel>
        </template>
      </Card>
    </div>
  </div>
</template>
