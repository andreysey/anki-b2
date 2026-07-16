<script setup lang="ts">
import { computed } from 'vue';
import type { Word } from '../types';
import ProgressBar from 'primevue/progressbar';

const props = defineProps<{
  vocabulary: Word[];
  masteredIds: Set<string>;
}>();

// Grouping by Thema
const stats = computed(() => {
  if (props.vocabulary.length === 0) return [];

  // Group vocabulary by theme
  const themesMap = new Map<number, { total: number; mastered: number }>();
  
  // Initialize with all unique themes
  props.vocabulary.forEach(word => {
    const key = word.thema;
    if (!themesMap.has(key)) {
      themesMap.set(key, { total: 0, mastered: 0 });
    }
    const themeStat = themesMap.get(key)!;
    themeStat.total++;
    
    // Check if word is mastered
    const wordKey = word.id || `${word.german}-${word.thema}`;
    if (props.masteredIds.has(wordKey)) {
      themeStat.mastered++;
    }
  });

  return Array.from(themesMap.entries()).map(([thema, item]) => {
    let name = `Theme ${thema}`;
    if (thema === 99) name = 'Unregelmäßige Verben';
    else if (thema === 98) name = 'Verben mit Präpositionen';
    else if (thema === 97) name = 'Adjektive mit Präpositionen';
    else if (thema === 96) name = 'Nomen-Verb-Verbindungen';
    else if (thema === 95) name = 'Redemittel';

    const percentage = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;

    return {
      thema,
      name,
      total: item.total,
      mastered: item.mastered,
      percentage
    };
  }).sort((a, b) => a.thema - b.thema);
});

const totalMastered = computed(() => props.masteredIds.size);
const totalWords = computed(() => props.vocabulary.length);
const totalPercentage = computed(() => {
  if (totalWords.value === 0) return 0;
  return Math.round((totalMastered.value / totalWords.value) * 100);
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Overall stats summary banner -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Total Vocabulary</div>
        <div class="text-4xl font-extrabold text-white">{{ totalWords }}</div>
      </div>
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Words Mastered</div>
        <div class="text-4xl font-extrabold text-success-500">{{ totalMastered }}</div>
      </div>
      <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-lg">
        <div class="text-sm font-semibold uppercase tracking-wider text-surface-400 mb-2">Overall Progress</div>
        <div class="text-4xl font-extrabold text-primary-500">{{ totalPercentage }}%</div>
      </div>
    </div>

    <!-- Overall Progress bar -->
    <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-3">
      <div class="flex justify-between items-center text-sm font-semibold">
        <span class="text-surface-200">Overall Course Progress</span>
        <span class="text-primary">{{ totalMastered }} / {{ totalWords }} mastered</span>
      </div>
      <ProgressBar :value="totalPercentage" class="h-4" />
    </div>

    <!-- Detailed Theme Progress -->
    <div class="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-lg space-y-6">
      <h3 class="text-lg font-bold text-white border-b border-surface-800 pb-3">Progress by Topic & Category</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="item in stats" :key="item.thema" class="space-y-2 p-4 bg-surface-950/45 border border-surface-800/60 rounded-xl hover:border-primary-500/35 transition-colors duration-300">
          <div class="flex justify-between items-start">
            <span class="font-bold text-sm text-surface-100 line-clamp-1" :title="item.name">{{ item.name }}</span>
            <span class="text-xs font-semibold text-surface-400 shrink-0">{{ item.mastered }}/{{ item.total }} ({{ item.percentage }}%)</span>
          </div>
          <ProgressBar :value="item.percentage" class="h-2" />
        </div>
      </div>
    </div>
  </div>
</template>
