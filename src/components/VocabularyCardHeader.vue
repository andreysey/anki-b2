<script setup lang="ts">
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import type { Word } from '../types';
import { getThemaLabel } from '../utils/thema';

defineProps<{
  word: Word;
}>();

const emit = defineEmits(['toggle-mastered']);
</script>

<template>
  <div class="flex justify-between items-center p-6 pb-0">
    <div class="flex gap-2">
      <Badge :value="word.level" severity="info" />
      <Badge :value="getThemaLabel(word.thema)" severity="secondary" />
    </div>
    <Button 
      icon="pi pi-check" 
      rounded 
      text 
      severity="success"
      aria-label="Mark as Mastered"
      @click.stop="emit('toggle-mastered', word)" 
      title="Mark as Mastered"
    />
  </div>
</template>
