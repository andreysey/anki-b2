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

</script>

<template>
  <div class="w-full max-w-[550px] h-[350px] xs:h-[380px] sm:h-[420px] [perspective:1500px] cursor-pointer mx-auto group" @click="emit('flip')">
    <div class="relative w-full h-full transition-all duration-[800ms] [transform-style:preserve-3d] shadow-2xl rounded-[32px]" :class="{ '[transform:rotateY(180deg)]': isFlipped }">
      <!-- Front -->
      <Card class="absolute w-full h-full [backface-visibility:hidden]">
        <template #header>
          <div class="flex justify-between items-center p-6 pb-0">
            <Badge :value="word.level" severity="info" />
            <Badge :value="'Thema ' + word.thema" severity="secondary" />
          </div>
        </template>
        <template #content>
          <ScrollPanel class="h-[200px]">
            <template v-if="showGermanOnFront">
              <div class="flex flex-col items-center gap-6 py-4">
                <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="word.german"></h2>
                <Button 
                  icon="pi pi-volume-up"
                  rounded
                  @click.stop="playAudio(word.german_audio)" 
                  title="Play pronunciation"
                />
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center gap-4 py-4">
                <div class="text-2xl sm:text-3xl font-bold">{{ word.ukrainian }}</div>
                <div class="text-lg text-surface-400">{{ word.english }}</div>
              </div>
            </template>
          </ScrollPanel>
        </template>
      </Card>

      <!-- Back -->
      <Card class="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <template #header>
          <div class="flex justify-between items-center p-6 pb-0">
            <Badge :value="word.level" severity="info" />
            <Badge :value="'Thema ' + word.thema" severity="secondary" />
          </div>
        </template>
        <template #content>
          <ScrollPanel class="h-[240px]">
            <template v-if="showGermanOnFront">
              <div class="flex flex-col items-center gap-4 py-4">
                <div class="text-2xl sm:text-3xl font-bold">{{ word.ukrainian }}</div>
                <div class="text-lg text-surface-400">{{ word.english }}</div>
              </div>
              <template v-if="word.example">
                <Divider />
                <div class="italic text-surface-300 text-center" v-html="word.example"></div>
              </template>
            </template>
            <template v-else>
              <div class="flex flex-col items-center gap-6 py-4">
                <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="word.german"></h2>
                <Button 
                  icon="pi pi-volume-up"
                  rounded
                  @click.stop="playAudio(word.german_audio)" 
                  title="Play pronunciation"
                />
              </div>
              <template v-if="word.example">
                <Divider />
                <div class="italic text-surface-300 text-center" v-html="word.example"></div>
              </template>
            </template>
          </ScrollPanel>
        </template>
      </Card>
    </div>
  </div>
</template>
