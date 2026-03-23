<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';

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
  <div class="scene" @click="emit('flip')">
    <div class="study-card" :class="{ 'is-flipped': isFlipped }">
      <!-- Front -->
      <div class="study-card-face study-card-front glass">
        <template v-if="showGermanOnFront">
          <h2 class="card-title">
            <span v-html="word.german"></span>
            <button class="tts-btn" @click.stop="playAudio(word.german_audio)" title="Play pronunciation">🔊</button>
          </h2>
          <div class="meta">(Thema {{ word.thema }})</div>
        </template>
        <template v-else>
          <div class="translation">{{ word.ukrainian }}</div>
          <div class="translation-en">{{ word.english }}</div>
          <div class="meta">(Thema {{ word.thema }})</div>
        </template>
      </div>

      <!-- Back -->
      <div class="study-card-face study-card-back glass">
        <template v-if="showGermanOnFront">
          <div class="translation">{{ word.ukrainian }}</div>
          <div class="translation-en">{{ word.english }}</div>
          <div v-if="word.example" class="example" v-html="word.example"></div>
        </template>
        <template v-else>
          <h2 class="card-title">
            <span v-html="word.german"></span>
            <button class="tts-btn" @click.stop="playAudio(word.german_audio)" title="Play pronunciation">🔊</button>
          </h2>
          <div v-if="word.example" class="example" v-html="word.example"></div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene {
  width: 100%;
  max-width: 500px;
  height: 350px;
  perspective: 1000px;
  cursor: pointer;
  margin: 0 auto;
}

.study-card {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.study-card.is-flipped {
  transform: rotateY(180deg);
}

.study-card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  border-radius: 24px;
}

.study-card-back {
  transform: rotateY(180deg);
}

.card-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  font-size: 2rem;
}

.translation {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.translation-en {
  font-size: 1.2rem;
  opacity: 0.7;
}

.meta {
  margin-top: 2rem;
  font-size: 0.9rem;
  opacity: 0.5;
}

.example {
  margin-top: 2rem;
  font-style: italic;
  opacity: 0.8;
  font-size: 1.1rem;
}
</style>
