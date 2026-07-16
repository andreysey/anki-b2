<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
import { sanitizeHtml } from '../utils/sanitize';
import AIAssistant from './AIAssistant.vue';

const props = defineProps<{
  word: Word;
  isFlipped: boolean;
  direction: StudyDirection;
}>();

const emit = defineEmits(['flip', 'toggle-mastered', 'play-audio']);

const playAudio = (text: string) => {
  emit('play-audio', text);
};

const showGermanOnFront = computed(() => props.direction === 'DE_TO_UA');

</script>

<template>
  <div class="relative w-full max-w-[550px] h-[450px] xs:h-[480px] sm:h-[520px] [perspective:1500px] cursor-pointer mx-auto group" @click="emit('flip')">
    <div class="relative w-full h-full transition-all duration-[800ms] [transform-style:preserve-3d] shadow-2xl rounded-[32px]" :class="{ '[transform:rotateY(180deg)]': isFlipped }">
      <!-- Front -->
      <div class="absolute top-0 left-0 w-full h-full [backface-visibility:hidden]">
        <Card class="w-full h-full">
          <template #header>
            <div class="flex justify-between items-center p-6 pb-0">
              <div class="flex gap-2">
                <Badge :value="word.level" severity="info" />
                <Badge :value="word.thema === 99 ? 'Unregelmäßige Verben' : word.thema === 98 ? 'Verben mit Präpositionen' : word.thema === 97 ? 'Adjektive mit Präpositionen' : word.thema === 96 ? 'Nomen-Verb-Verbindungen' : word.thema === 95 ? 'Redemittel' : 'Theme ' + word.thema" severity="secondary" />
              </div>
              <Button 
                icon="pi pi-check" 
                rounded 
                text 
                severity="success"
                @click.stop="emit('toggle-mastered', word)" 
                title="Mark as Mastered"
              />
            </div>
          </template>
          <template #content>
            <ScrollPanel class="h-[280px]">
              <template v-if="showGermanOnFront">
                <div class="flex flex-col items-center gap-6 py-4">
                  <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="sanitizeHtml(word.german)"></h2>
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
      </div>

      <!-- Back -->
      <div class="absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <Card class="w-full h-full">
          <template #header>
            <div class="flex justify-between items-center p-6 pb-0">
              <div class="flex gap-2">
                <Badge :value="word.level" severity="info" />
                <Badge :value="word.thema === 99 ? 'Unregelmäßige Verben' : word.thema === 98 ? 'Verben mit Präpositionen' : word.thema === 97 ? 'Adjektive mit Präpositionen' : word.thema === 96 ? 'Nomen-Verb-Verbindungen' : word.thema === 95 ? 'Redemittel' : 'Theme ' + word.thema" severity="secondary" />
              </div>
              <Button 
                icon="pi pi-check" 
                rounded 
                text 
                severity="success"
                @click.stop="emit('toggle-mastered', word)" 
                title="Mark as Mastered"
              />
            </div>
          </template>
          <template #content>
            <ScrollPanel class="h-[340px]">
              <template v-if="showGermanOnFront">
                <div class="flex flex-col items-center gap-4 py-4">
                  <div class="text-2xl sm:text-3xl font-bold">{{ word.ukrainian }}</div>
                  <div class="text-lg text-surface-400">{{ word.english }}</div>
                </div>
                <template v-if="word.example">
                  <Divider />
                  <div class="italic text-surface-300 text-center [&_strong]:text-primary [&_b]:text-primary" v-html="sanitizeHtml(word.example)"></div>
                </template>
              </template>
              <template v-else>
                <div class="flex flex-col items-center gap-6 py-4">
                  <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="sanitizeHtml(word.german)"></h2>
                  <Button 
                    icon="pi pi-volume-up"
                    rounded
                    @click.stop="playAudio(word.german_audio)" 
                    title="Play pronunciation"
                  />
                </div>
                <template v-if="word.example">
                  <Divider />
                  <div class="italic text-surface-300 text-center [&_strong]:text-primary [&_b]:text-primary" v-html="sanitizeHtml(word.example)"></div>
                </template>
              </template>

              <!-- AI Assistant integrations -->
              <AIAssistant :word="word" />
            </ScrollPanel>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
