<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';

const props = defineProps<{
  vocabulary: Word[];
  search: string;
  level: string;
  thema: string;
}>();

const emit = defineEmits(['update:search', 'update:level', 'update:thema']);

const themes = computed(() => {
  const relevantVocab = props.level === 'all' 
    ? props.vocabulary 
    : props.vocabulary.filter(item => item.level === props.level);
    
  return [...new Set(relevantVocab.map(item => item.thema))].sort((a, b) => a - b);
});
</script>

<template>
  <div class="filters glass">
    <input 
      type="text" 
      :value="search"
      @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      placeholder="Search words (German, English, Ukrainian)..." 
      class="search-input"
    >
    <div class="filter-group">
      <select :value="level" @change="emit('update:level', ($event.target as HTMLSelectElement).value)">
        <option value="all">All Levels</option>
        <option value="B1+">B1+</option>
        <option value="B2">B2</option>
      </select>
      <select :value="thema" @change="emit('update:thema', ($event.target as HTMLSelectElement).value)">
        <option value="all">All Themes</option>
        <option v-for="t in themes" :key="t" :value="t.toString()">Theme {{ t }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

select {
  flex: 1;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
}
</style>
