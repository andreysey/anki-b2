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

const selectPt = {
  root: 'flex relative w-full h-11 bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all hover:border-[#00d2ff]/50',
  label: 'flex items-center px-4 text-white text-[0.95rem]',
  placeholder: 'flex items-center px-4 text-white/50 text-[0.95rem]',
  dropdown: 'flex items-center justify-center w-10 text-white/50',
  panel: 'bg-[#1e293b] border border-white/10 rounded-xl shadow-xl mt-1 overflow-hidden z-50',
  list: 'p-1 flex flex-col gap-0.5',
  item: ({ context }: any) => ({
    class: [
      'px-4 py-2 rounded-lg cursor-pointer transition-all text-[0.95rem]',
      context.focused ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
    ]
  })
};

const inputPt = {
  root: 'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-[0.95rem] focus:outline-none focus:border-[#00d2ff]/50 focus:bg-white/10 transition-all placeholder:text-white/30'
};

const buttonPt = {
  root: 'whitespace-nowrap px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:translate-y-0 transition-all w-full sm:w-auto flex items-center justify-center'
};
</script>

<template>
  <div class="filters glass p-4 mb-6 flex flex-col md:flex-row gap-4 items-center w-full">
    <div class="w-full md:flex-1">
      <InputText 
        :modelValue="search"
        @update:modelValue="emit('update:search', $event)"
        placeholder="Search words..." 
        unstyled
        :pt="inputPt"
      />
    </div>
    
    <div class="flex gap-2 w-full md:w-auto items-center flex-wrap sm:flex-nowrap">
      <div class="flex gap-2 flex-1 sm:flex-none sm:min-w-[240px]">
        <Select 
          :modelValue="level" 
          @update:modelValue="emit('update:level', $event)"
          :options="levelOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Levels"
          unstyled
          :pt="selectPt"
        />

        <Select 
          :modelValue="thema" 
          @update:modelValue="emit('update:thema', $event)"
          :options="themeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Themes"
          unstyled
          :pt="selectPt"
        />
      </div>

      <Button 
        :label="isStudyMode ? '📋 List' : '🎓 Study'"
        @click="emit('update:isStudyMode', !isStudyMode)"
        unstyled
        :pt="buttonPt"
      />
    </div>
  </div>
</template>

<style scoped>
/* No manual CSS needed anymore, all handled by Tailwind and PrimeVue pt */
</style>
