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
  (e: 'swipe-left'): void;
  (e: 'swipe-right'): void;
}>();

const isAiActive = ref(false);

const touchStartX = ref<number | null>(null);
const touchStartY = ref<number | null>(null);

// Reset AI expansion when card/word flips back or changes
watch(
  () => props.word,
  () => {
    isAiActive.value = false;
  }
);

const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // Ignore haptic errors on unsupported hardware
    }
  }
};

const handleCardClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  // Prevent card flipping when clicking buttons, inputs, dialogs, audio controls, or links
  if (target && target !== event.currentTarget) {
    if (
      target.closest(
        'button, input, textarea, a, select, [role="dialog"], [data-reka-dialog-content], [data-radix-dialog-content]'
      )
    ) {
      return;
    }
  }
  triggerHaptic();
  emit('flip');
};

const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (touch) {
    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  if (touchStartX.value === null || touchStartY.value === null) return;
  const touch = event.changedTouches[0];
  if (!touch) return;

  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = touch.clientY - touchStartY.value;

  // Check if horizontal swipe exceeds 50px threshold and is more horizontal than vertical
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    triggerHaptic();
    if (deltaX < -50) {
      emit('swipe-left');
    } else if (deltaX > 50) {
      emit('swipe-right');
    }
  }

  touchStartX.value = null;
  touchStartY.value = null;
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.closest('[role="dialog"], [data-reka-dialog-content], [data-radix-dialog-content]')
  ) {
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    triggerHaptic();
    emit('flip');
  }
};

const showGermanOnFront = computed(() => props.direction === 'DE_TO_UA');
</script>

<template>
  <div
    class="relative w-full max-w-140 perspective-[1400px] cursor-pointer mx-auto group focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-[28px] transition-all duration-500 ease-out select-none"
    :class="[
      isFlipped && isAiActive
        ? 'h-137.5 xs:h-147.5 sm:h-160'
        : 'h-97.5 xs:h-102.5 sm:h-110'
    ]"
    tabindex="0"
    role="button"
    :aria-expanded="isFlipped"
    aria-label="Vocabulary card. Press Space or Enter to flip, swipe left or right on mobile"
    @click="handleCardClick"
    @keydown="handleKeyDown"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div
      class="relative w-full h-full transition-all duration-700 transform-3d shadow-xl rounded-[26px]"
      :class="{ 'transform-[rotateY(180deg)]': isFlipped }"
    >
      <!-- Front Face -->
      <div class="absolute top-0 left-0 w-full h-full card-face card-face-front">
        <VocabularyCardFace
          :word="word"
          :show-german="showGermanOnFront"
          scroll-panel-height="h-62.5 sm:h-70"
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
          scroll-panel-height="h-67.5 sm:h-75"
          @toggle-mastered="emit('toggle-mastered', $event)"
          @play-audio="emit('play-audio', $event)"
          @ai-active="isAiActive = $event"
        />
      </div>
    </div>
  </div>
</template>
