<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

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

const themeOptions = computed(() => {
  return [
    { label: 'Themes', value: 'all' },
    ...themes.value.map(t => ({ label: `Theme ${t}`, value: t.toString() }))
  ];
});

const levelOptions = [
  { label: 'Levels', value: 'all' },
  { label: 'B1+', value: 'B1+' },
  { label: 'B2', value: 'B2' }
];

</script>

<template>
  <div class="p-6 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6 items-end bg-surface-900 border border-surface-800 rounded-3xl shadow-xl">
    <!-- Search Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-xs font-bold uppercase tracking-wider text-primary ml-2">Search Vocabulary</span>
      <InputText 
        :modelValue="search"
        @update:modelValue="emit('update:search', $event)"
        placeholder="Type to filter..." 
        class="w-full"
      />
    </div>
    
    <!-- Level Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-xs font-bold uppercase tracking-wider text-surface-400 ml-2">Level</span>
      <Select 
        :modelValue="level" 
        @update:modelValue="emit('update:level', $event)"
        :options="levelOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Level"
        class="w-full"
      />
    </div>

    <!-- Theme Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-xs font-bold uppercase tracking-wider text-surface-400 ml-2">Theme</span>
      <Select 
        :modelValue="thema" 
        @update:modelValue="emit('update:thema', $event)"
        :options="themeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Theme"
        class="w-full"
      />
    </div>

    <!-- Mode Toggle Section -->
    <div class="w-full flex flex-col gap-2">
      <!-- Hidden label for alignment -->
      <span class="hidden lg:block text-[0.75rem] invisible">&nbsp;</span>
      <Button 
        :label="isStudyMode ? 'Back to List' : 'Start Study'"
        :icon="isStudyMode ? 'pi pi-list' : 'pi pi-graduation-cap'"
        @click="emit('update:isStudyMode', !isStudyMode)"
        :severity="isStudyMode ? 'success' : 'primary'"
        class="w-full"
      />
    </div>
  </div>
</template>

<style scoped>
/* No manual CSS needed anymore, all handled by Tailwind and PrimeVue pt */
</style>
