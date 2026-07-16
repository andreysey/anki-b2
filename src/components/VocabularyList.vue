<script setup lang="ts">
import Card from 'primevue/card';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import type { Word } from '../types';
import { sanitizeHtml } from '../utils/sanitize';

defineProps<{
  vocabulary: Word[];
  displayLimit: number;
}>();

const emit = defineEmits(['load-more', 'play-audio', 'toggle-mastered']);

const getItemKey = (item: Word) => `${item.german}-${item.level}-${item.thema}`;
</script>

<template>
  <div class="flex flex-col gap-16 sm:gap-24">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
      <Card 
        v-for="item in vocabulary.slice(0, displayLimit)" 
        :key="getItemKey(item)" 
      >
        <template #header>
          <div class="flex justify-between p-6 pb-0">
            <Badge :value="item.level" severity="info" />
            <Badge :value="item.thema === 99 ? 'Unregelmäßige Verben' : item.thema === 98 ? 'Verben mit Präpositionen' : item.thema === 97 ? 'Adjektive mit Präpositionen' : 'Theme ' + item.thema" severity="secondary" />
          </div>
        </template>
        <template #content>
          <div class="flex justify-between items-start mb-4 gap-4">
            <div class="text-xl font-bold leading-tight" v-html="sanitizeHtml(item.german)"></div>
            <div class="flex items-center gap-1 shrink-0">
              <Button 
                icon="pi pi-check" 
                rounded 
                text 
                severity="success"
                @click.stop="emit('toggle-mastered', item)" 
                title="Mark as Mastered"
              />
              <Button 
                icon="pi pi-volume-up" 
                rounded 
                text 
                @click.stop="emit('play-audio', item.german_audio)" 
                title="Play pronunciation"
              />
            </div>
          </div>
          <div class="space-y-2 mb-4">
            <div class="text-primary-400 font-semibold">{{ item.english }}</div>
            <div class="text-orange-400 font-semibold">{{ item.ukrainian }}</div>
          </div>
          <template v-if="item.example">
            <Divider />
            <div class="italic text-surface-400 text-sm leading-relaxed" v-html="sanitizeHtml(item.example)"></div>
          </template>
        </template>
      </Card>
    </div>

    <!-- Load More -->
    <div v-if="displayLimit < vocabulary.length" class="flex justify-center pb-20">
      <Button 
        label="Explore More Vocabulary" 
        icon="pi pi-plus"
        @click="emit('load-more')"
        outlined
      />
    </div>
  </div>
</template>
