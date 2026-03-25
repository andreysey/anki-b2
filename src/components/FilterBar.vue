<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import BaseSelect from './BaseSelect.vue';

const props = defineProps<{
  vocabulary: Word[];
  search: string;
  level: string;
  thema: string;
  isStudyMode: boolean;
}>();

const emit = defineEmits(['update:search', 'update:level', 'update:thema', 'update:isStudyMode']);

const themes = computed(() => {
  const relevantVocab = props.level === 'all' 
    ? props.vocabulary 
    : props.vocabulary.filter(item => item.level === props.level);
    
  return [...new Set(relevantVocab.map(item => item.thema))].sort((a, b) => a - b);
});
</script>

<template>
  <div class="filters glass">
    <div class="search-container">
      <input 
        type="text" 
        :value="search"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
        placeholder="Search words..." 
        class="search-input"
      >
    </div>
    
    <div class="controls-group">
      <div class="filter-group">
        <BaseSelect 
          :modelValue="level" 
          @update:modelValue="emit('update:level', $event)"
          placeholder="Levels"
        >
          <option value="B1+">B1+</option>
          <option value="B2">B2</option>
        </BaseSelect>

        <BaseSelect 
          :modelValue="thema" 
          @update:modelValue="emit('update:thema', $event)"
          placeholder="Themes"
        >
          <option v-for="t in themes" :key="t" :value="t.toString()">Theme {{ t }}</option>
        </BaseSelect>
      </div>

      <button class="nav-btn mode-toggle" @click="emit('update:isStudyMode', !isStudyMode)">
        {{ isStudyMode ? '📋 List' : '🎓 Study' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.search-container {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
}

.controls-group {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.mode-toggle {
  white-space: nowrap;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s ease;
}

.mode-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(79, 70, 229, 0.4);
  filter: brightness(1.1);
}

.mode-toggle:active {
  transform: translateY(0);
}

@media (min-width: 850px) {
  .filters {
    flex-direction: row;
    align-items: center;
  }
  
  .controls-group {
    flex: 0 0 auto;
  }
}
</style>
