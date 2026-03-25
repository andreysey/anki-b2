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
  root: 'flex relative w-full h-12 bg-white/5 border border-white/10 rounded-2xl cursor-pointer transition-all hover:border-[#00d2ff]/50 hover:bg-white/10 shadow-lg shadow-black/20 overflow-hidden',
  label: 'flex items-center px-5 text-white text-[0.95rem] font-medium leading-[3rem] h-full',
  placeholder: 'flex items-center px-5 text-white/40 text-[0.95rem] font-medium leading-[3rem] h-full',
  dropdown: 'flex items-center justify-center w-12 text-white/50 h-full border-l border-white/5',
  panel: 'bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl mt-2 overflow-hidden z-[100] backdrop-blur-xl',
  list: 'p-2 flex flex-col gap-1',
  item: ({ context }: any) => ({
    class: [
      'px-4 py-3 rounded-xl cursor-pointer transition-all text-[0.95rem] font-medium',
      context.focused ? 'bg-white/15 text-[#00d2ff]' : 'text-white/70 hover:bg-white/5 hover:text-white'
    ]
  })
};

const inputPt = {
  root: 'w-full px-5 py-0 h-12 bg-white/5 border border-white/10 rounded-2xl text-white text-[0.95rem] font-medium focus:outline-none focus:border-[#00d2ff]/50 focus:bg-white/10 transition-all placeholder:text-white/30 shadow-lg shadow-black/20 flex items-center'
};

const buttonPt = {
  root: 'whitespace-nowrap px-6 py-0 h-12 text-[0.95rem] font-bold rounded-2xl text-white shadow-xl transition-all w-full flex items-center justify-center gap-2 hover:-translate-y-1 active:scale-95'
};
</script>

<template>
  <div class="filters glass p-6 sm:p-8 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-4 sm:gap-6 items-end shadow-2xl backdrop-blur-xl border border-white/10 rounded-[2.5rem]">
    <!-- Search Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-[0.65rem] sm:text-[0.75rem] font-black uppercase tracking-[0.2em] text-[#00d2ff] opacity-70 ml-4">Search Vocabulary</span>
      <InputText 
        :modelValue="search"
        @update:modelValue="emit('update:search', $event)"
        placeholder="Type to filter..." 
        unstyled
        :pt="inputPt"
      />
    </div>
    
    <!-- Level Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-[0.65rem] sm:text-[0.75rem] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Level</span>
      <Select 
        :modelValue="level" 
        @update:modelValue="emit('update:level', $event)"
        :options="levelOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Level"
        unstyled
        :pt="selectPt"
      />
    </div>

    <!-- Theme Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-[0.65rem] sm:text-[0.75rem] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Theme</span>
      <Select 
        :modelValue="thema" 
        @update:modelValue="emit('update:thema', $event)"
        :options="themeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select Theme"
        unstyled
        :pt="selectPt"
      />
    </div>

    <!-- Mode Toggle Section -->
    <div class="w-full flex flex-col gap-2">
      <!-- Hidden label for alignment -->
      <span class="hidden lg:block text-[0.75rem] invisible">&nbsp;</span>
      <Button 
        :label="isStudyMode ? '📋 Back to List' : '🎓 Start Study'"
        @click="emit('update:isStudyMode', !isStudyMode)"
        unstyled
        :pt="{
          root: [
            buttonPt.root,
            isStudyMode ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-green-500/30' : 'bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] shadow-[#00d2ff]/30'
          ]
        }"
      />
    </div>
  </div>
</template>

<style scoped>
/* No manual CSS needed anymore, all handled by Tailwind and PrimeVue pt */
</style>
