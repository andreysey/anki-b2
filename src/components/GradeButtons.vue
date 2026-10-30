<script setup lang="ts">
type Rating = 'again' | 'hard' | 'good' | 'easy';

const emit = defineEmits<{
  (e: 'grade', rating: Rating): void;
}>();

interface Grade {
  rating: Rating;
  label: string;
  title: string;
  key: number;
  /** Swipe direction that also gives this grade on touch screens */
  swipe?: '←' | '→';
  tone: string;
}

const GRADES: Grade[] = [
  {
    rating: 'again',
    label: 'AGAIN (1)',
    title: 'Again: reset card to level 0 (Shortcut: Key 1 or Swipe Left)',
    key: 1,
    swipe: '←',
    tone: 'bg-red-50 hover:bg-red-100/80 dark:bg-red-500/15 dark:hover:bg-red-500/25 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
  },
  {
    rating: 'hard',
    label: 'HARD (2)',
    title: 'Hard: repeat with same interval (Shortcut: Key 2)',
    key: 2,
    tone: 'bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
  },
  {
    rating: 'good',
    label: 'GOOD (3)',
    title: 'Good: advance card level by 1 (Shortcut: Key 3 or Swipe Right)',
    key: 3,
    swipe: '→',
    tone: 'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
  },
  {
    rating: 'easy',
    label: 'EASY (4)',
    title: 'Easy: advance card level by 2 (Shortcut: Key 4)',
    key: 4,
    tone: 'bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
  }
];
</script>

<template>
  <!-- macOS Floating Action Island (SRS Grading HUD) -->
  <div
    class="macos-floating-hud p-2 sm:p-2.5 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-slate-200/40 dark:shadow-2xl"
  >
    <button
      v-for="grade in GRADES"
      :key="grade.rating"
      :title="grade.title"
      :class="[
        'flex flex-col items-center justify-center py-2 px-1.5 sm:px-2 rounded-xl active:scale-95 border font-bold transition-all cursor-pointer group',
        grade.tone
      ]"
      @click="emit('grade', grade.rating)"
    >
      <span class="text-xs tracking-wide">{{ grade.label }}</span>
      <!-- Keyboard hint is hidden on touch screens; swipe hint stays -->
      <span v-if="grade.swipe" class="text-[9.5px] font-mono mt-0.5">
        <span class="hidden sm:inline pointer-coarse:hidden">Key {{ grade.key }} / </span>Swipe
        {{ grade.swipe }}
      </span>
      <span v-else class="pointer-coarse:hidden text-[9.5px] font-mono mt-0.5"
        >Key {{ grade.key }}</span
      >
    </button>
  </div>
</template>
