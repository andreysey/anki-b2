<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Panel from 'primevue/panel';

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
  <Panel class="shadow-xl p-fluid">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
      <span class="text-xs font-bold uppercase tracking-wider text-surface-400 ml-2 lg:invisible lg:h-4">Action</span>
      <Button 
        :label="isStudyMode ? 'Back to List' : 'Start Study'"
        :icon="isStudyMode ? 'pi pi-list' : 'pi pi-graduation-cap'"
        @click="emit('update:isStudyMode', !isStudyMode)"
        :severity="isStudyMode ? 'success' : 'primary'"
      />
    </div>
    </div>
  </Panel>
</template>

<style scoped>
/* No manual CSS needed anymore, all handled by Tailwind and PrimeVue pt */
</style>
