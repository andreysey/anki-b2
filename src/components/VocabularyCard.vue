<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

const isAiActive = ref(false);

// Reset AI expansion when card/word flips back or changes
watch(
  () => props.word,
  () => {
    isAiActive.value = false;
  }
);

const handleCardClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  // Prevent card flipping when clicking buttons, inputs, dialogs, audio controls, or links
  if (target && target !== event.currentTarget) {
    if (
      target.closest(
        'button, input, textarea, a, select, .p-button, .p-dialog, .p-dialog-mask, [role="dialog"]'
      )
    ) {
      return;
    }
  }
  emit('flip');
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.closest('.p-dialog, .p-dialog-mask')
  ) {
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
    class="relative w-full max-w-[560px] [perspective:1400px] cursor-pointer mx-auto group focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-[28px] transition-all duration-500 ease-out"
    :class="[
      isFlipped && isAiActive
        ? 'h-[550px] xs:h-[590px] sm:h-[640px]'
        : 'h-[390px] xs:h-[410px] sm:h-[440px]'
    ]"
    tabindex="0"
    role="button"
    :aria-expanded="isFlipped"
    aria-label="Vocabulary card. Press Space or Enter to flip"
    @click="handleCardClick"
    @keydown="handleKeyDown"
  >
    <div
      class="relative w-full h-full transition-all duration-[700ms] [transform-style:preserve-3d] shadow-xl rounded-[26px]"
      :class="{ '[transform:rotateY(180deg)]': isFlipped }"
    >
      <!-- Front Face -->
      <div class="absolute top-0 left-0 w-full h-full card-face card-face-front">
        <VocabularyCardFace
          :word="word"
          :show-german="showGermanOnFront"
          scroll-panel-height="h-[250px] sm:h-[280px]"
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
          scroll-panel-height="h-[270px] sm:h-[300px]"
          @toggle-mastered="emit('toggle-mastered', $event)"
          @play-audio="emit('play-audio', $event)"
          @ai-active="isAiActive = $event"
        />
      </div>
    </div>
  </div>
</template>
