<script setup lang="ts">
import { computed } from 'vue';
import type { Word, StudyDirection } from '../types';
import VocabularyCardFace from './VocabularyCardFace.vue';

const props = defineProps<{
  word: Word;
  isFlipped: boolean;
  direction: StudyDirection;
}>();

const emit = defineEmits<{
  (e: 'flip'): void;
  (e: 'toggle-mastered', word: Word): void;
  (e: 'play-audio', text: string): void;
}>();

const handleCardClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  // Prevent card flipping when clicking buttons, inputs, dialogs, audio controls, or links
  if (target && target !== event.currentTarget) {
    if (target.closest('button, input, textarea, a, select, .p-button, .p-dialog, .p-dialog-mask, [role="dialog"]')) {
      return;
    }
  }
  emit('flip');
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.closest('.p-dialog, .p-dialog-mask')) {
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('flip');
  }
};

const showGermanOnFront = computed(() => props.direction === 'DE_TO_UA');
</script>

<template>
  <div 
    class="relative w-full max-w-[560px] h-[450px] xs:h-[480px] sm:h-[510px] [perspective:1400px] cursor-pointer mx-auto group focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-[30px]" 
    tabindex="0"
    role="button"
    :aria-expanded="isFlipped"
    aria-label="Vocabulary card. Press Space or Enter to flip"
    @click="handleCardClick"
    @keydown="handleKeyDown"
  >
    <div 
      class="relative w-full h-full transition-all duration-[700ms] [transform-style:preserve-3d] shadow-2xl rounded-[28px]" 
      :class="{ '[transform:rotateY(180deg)]': isFlipped }"
    >
      <!-- Front Face -->
      <div class="absolute top-0 left-0 w-full h-full card-face card-face-front">
        <VocabularyCardFace
          :word="word"
          :show-german="showGermanOnFront"
          scroll-panel-height="h-[280px]"
          @toggle-mastered="emit('toggle-mastered', $event)"
          @play-audio="emit('play-audio', $event)"
        />
      </div>

      <!-- Back Face -->
      <div class="absolute top-0 left-0 w-full h-full card-face card-face-back">
        <VocabularyCardFace
          :word="word"
          :show-german="!showGermanOnFront"
          :show-example="true"
          :show-ai="true"
          scroll-panel-height="h-[340px]"
          @toggle-mastered="emit('toggle-mastered', $event)"
          @play-audio="emit('play-audio', $event)"
        />
      </div>
    </div>
  </div>
</template>
