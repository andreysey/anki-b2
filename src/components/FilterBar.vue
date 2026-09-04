<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from './ui/select';
import { Search, X, List, GraduationCap } from 'lucide-vue-next';
import { getThemaLabel } from '../utils/thema';

const props = defineProps<{
  vocabulary: Word[];
  search: string;
  level: string;
  thema: string;
  isStudyMode: boolean;
  totalCount?: number;
  filteredCount?: number;
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:level', value: string): void;
  (e: 'update:thema', value: string): void;
  (e: 'update:isStudyMode', value: boolean): void;
}>();

const themes = computed(() => {
  const relevantVocab =
    props.level === 'all'
      ? props.vocabulary
      : props.vocabulary.filter((item) => item.level === props.level);

  return [...new Set(relevantVocab.map((item) => item.thema))].sort((a, b) => a - b);
});

const themeOptions = computed(() => {
  return [
    { label: 'All Themes', value: 'all' },
    ...themes.value.map((t) => ({
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

const handleClearSearch = () => {
  emit('update:search', '');
};

const toggleStudyModeLabel = computed(() => (props.isStudyMode ? 'Back to List' : 'Start Study'));
</script>

<template>
  <div
    class="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col gap-3"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-center">
      <!-- Spotlight Search Section with Clear Button -->
      <div class="w-full relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"
        >
          <Search class="h-4 w-4" />
        </div>
        <Input
          :modelValue="search"
          @update:modelValue="(val) => emit('update:search', String(val ?? ''))"
          placeholder="Search vocabulary..."
          class="w-full pl-9 pr-8 text-xs sm:text-sm h-9 bg-slate-50/90 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl"
        />
        <button
          v-if="search"
          type="button"
          @click="handleClearSearch"
          aria-label="Clear search input"
          title="Clear search"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Level Filter -->
      <div class="w-full">
        <Select
          :modelValue="level"
          @update:modelValue="(val) => emit('update:level', String(val ?? 'all'))"
        >
          <SelectTrigger class="w-full text-xs sm:text-sm h-9 bg-slate-50/90 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl">
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in levelOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Theme Filter -->
      <div class="w-full">
        <Select
          :modelValue="thema"
          @update:modelValue="(val) => emit('update:thema', String(val ?? 'all'))"
        >
          <SelectTrigger class="w-full text-xs sm:text-sm h-9 bg-slate-50/90 dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl">
            <SelectValue placeholder="Select Theme" />
          </SelectTrigger>
          <SelectContent class="max-h-72">
            <SelectItem
              v-for="opt in themeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Mode Toggle Section -->
      <div class="w-full">
        <Button
          variant="default"
          @click="emit('update:isStudyMode', !isStudyMode)"
          class="w-full rounded-xl shadow-xs font-semibold text-xs sm:text-sm h-9"
        >
          <component :is="isStudyMode ? List : GraduationCap" class="h-4 w-4" />
          <span>{{ toggleStudyModeLabel }}</span>
        </Button>
      </div>
    </div>

    <!-- Live Results Counter Badge -->
    <div
      v-if="typeof filteredCount === 'number' && typeof totalCount === 'number'"
      class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1 border-t border-slate-100 dark:border-white/5"
    >
      <div class="flex items-center gap-1.5 font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
        <span>
          Showing
          <strong class="text-slate-800 dark:text-slate-200">{{ filteredCount }}</strong> of
          {{ totalCount }} words
        </span>
      </div>
      <div
        v-if="search || level !== 'all' || thema !== 'all'"
        class="text-[10px] text-slate-400 font-mono"
      >
        Filtered
      </div>
    </div>
  </div>
</template>
