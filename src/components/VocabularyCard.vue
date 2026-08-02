<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import ScrollPanel from 'primevue/scrollpanel';
import Button from 'primevue/button';
import { sanitizeHtml } from '../utils/sanitize';
import VocabularyCardHeader from './VocabularyCardHeader.vue';
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

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('flip');
  }
};

const showGermanOnFront = computed(() => props.direction === 'DE_TO_UA');

</script>

<template>
  <div 
    class="relative w-full max-w-[550px] h-[450px] xs:h-[480px] sm:h-[520px] [perspective:1500px] cursor-pointer mx-auto group focus:outline-none focus:ring-2 focus:ring-primary rounded-[32px]" 
    tabindex="0"
    role="button"
    :aria-expanded="isFlipped"
    aria-label="Vocabulary card. Press Space or Enter to flip"
    @click="emit('flip')"
    @keydown="handleKeyDown"
  >
    <div class="relative w-full h-full transition-all duration-[800ms] [transform-style:preserve-3d] shadow-2xl rounded-[32px]" :class="{ '[transform:rotateY(180deg)]': isFlipped }">
      <!-- Front -->
      <div class="absolute top-0 left-0 w-full h-full [backface-visibility:hidden]">
        <Card class="w-full h-full">
          <template #header>
            <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />
          </template>
          <template #content>
            <ScrollPanel class="h-[280px]">
              <template v-if="showGermanOnFront">
                <div class="flex flex-col items-center gap-6 py-4">
                  <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="sanitizeHtml(word.german)"></h2>
                  <Button 
                    icon="pi pi-volume-up"
                    rounded
                    aria-label="Play German pronunciation"
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
            <VocabularyCardHeader :word="word" @toggle-mastered="emit('toggle-mastered', $event)" />
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
                  <div class="flex items-center justify-center gap-2">
                    <div class="italic text-surface-300 text-center [&_strong]:text-primary [&_b]:text-primary" v-html="sanitizeHtml(word.example)"></div>
                    <Button 
                      icon="pi pi-volume-up"
                      rounded
                      text
                      severity="secondary"
                      size="small"
                      class="shrink-0"
                      aria-label="Play example sentence pronunciation"
                      @click.stop="playAudio(word.example)" 
                      title="Play example sentence"
                    />
                  </div>
                </template>
              </template>
              <template v-else>
                <div class="flex flex-col items-center gap-6 py-4">
                  <h2 class="text-3xl sm:text-4xl font-bold text-center" v-html="sanitizeHtml(word.german)"></h2>
                  <Button 
                    icon="pi pi-volume-up"
                    rounded
                    aria-label="Play German pronunciation"
                    @click.stop="playAudio(word.german_audio)" 
                    title="Play pronunciation"
                  />
                </div>
                <template v-if="word.example">
                  <Divider />
                  <div class="flex items-center justify-center gap-2">
                    <div class="italic text-surface-300 text-center [&_strong]:text-primary [&_b]:text-primary" v-html="sanitizeHtml(word.example)"></div>
                    <Button 
                      icon="pi pi-volume-up"
                      rounded
                      text
                      severity="secondary"
                      size="small"
                      class="shrink-0"
                      aria-label="Play example sentence pronunciation"
                      @click.stop="playAudio(word.example)" 
                      title="Play example sentence"
                    />
                  </div>
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
