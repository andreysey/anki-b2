<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { getThemaLabel } from '../utils/thema';

const props = defineProps<{
  vocabulary: Word[];
  search: string;
  level: string;
  thema: string;
  isStudyMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:level', value: string): void;
  (e: 'update:thema', value: string): void;
  (e: 'update:isStudyMode', value: boolean): void;
}>();

const themes = computed(() => {
  const relevantVocab = props.level === 'all' 
    ? props.vocabulary 
    : props.vocabulary.filter(item => item.level === props.level);
    
  return [...new Set(relevantVocab.map(item => item.thema))].sort((a, b) => a - b);
});

const themeOptions = computed(() => {
  return [
    { label: 'All Themes', value: 'all' },
    ...themes.value.map(t => ({ 
      label: getThemaLabel(t), 
      value: t.toString() 
    }))
  ];
});

const levelOptions = [
  { label: 'All Levels', value: 'all' },
  { label: 'B1+', value: 'B1+' },
  { label: 'B2', value: 'B2' }
];
</script>

<template>
  <div class="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-md">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
      <!-- Spotlight Search Section -->
      <div class="w-full relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
          <i class="pi pi-search text-xs"></i>
        </div>
        <InputText 
          :modelValue="search"
          @update:modelValue="(val) => emit('update:search', val ?? '')"
          placeholder="Spotlight search vocabulary..." 
          class="w-full !pl-8 text-sm !bg-surface-50 dark:!bg-black/40 !border-surface-200 dark:!border-white/10 !rounded-xl"
        />
      </div>
      
      <!-- Level Filter -->
      <div class="w-full">
        <Select 
          :modelValue="level" 
          @update:modelValue="(val) => emit('update:level', val ?? 'all')"
          :options="levelOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Level"
          class="w-full text-sm !bg-surface-50 dark:!bg-black/40 !border-surface-200 dark:!border-white/10 !rounded-xl"
        />
      </div>

      <!-- Theme Filter -->
      <div class="w-full">
        <Select 
          :modelValue="thema" 
          @update:modelValue="(val) => emit('update:thema', val ?? 'all')"
          :options="themeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Theme"
          class="w-full text-sm !bg-surface-50 dark:!bg-black/40 !border-surface-200 dark:!border-white/10 !rounded-xl"
        />
      </div>

      <!-- Mode Toggle Section -->
      <div class="w-full">
        <Button 
          :label="isStudyMode ? 'Back to List' : 'Start Study'"
          :icon="isStudyMode ? 'pi pi-list' : 'pi pi-graduation-cap'"
          @click="emit('update:isStudyMode', !isStudyMode)"
          severity="primary"
          class="w-full !rounded-xl shadow-xs active:scale-95 transition-all text-sm font-semibold !py-2.5"
        />
      </div>
    </div>
  </div>
</template>
