<script setup lang="ts">
import { computed } from 'vue';
import { Check } from '@lucide/vue';

const props = defineProps<{
  hasNano: boolean;
  hasLocalModel: boolean;
  resultModel: string;
  hasCloudKey: boolean;
}>();

type BadgeKind = 'nano' | 'local' | 'model' | 'cloud' | 'setup';

// First available backend wins, mirroring the order callAI tries them in
const kind = computed<BadgeKind>(() => {
  if (props.hasNano) return 'nano';
  if (props.hasLocalModel) return 'local';
  if (props.resultModel) return 'model';
  if (props.hasCloudKey) return 'cloud';
  return 'setup';
});

const BASE = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border';
const TONES = {
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'
};

const TONE_BY_KIND: Record<BadgeKind, string> = {
  nano: TONES.green,
  local: TONES.green,
  model: TONES.blue,
  cloud: TONES.blue,
  setup: TONES.amber
};
const tone = computed(() => TONE_BY_KIND[kind.value]);

const LABELS: Record<Exclude<BadgeKind, 'model'>, string> = {
  nano: 'Gemini Nano',
  local: 'Local AI (Offline)',
  cloud: 'Gemini Cloud (Active)',
  setup: 'Setup Required'
};
</script>

<template>
  <span
    :class="[BASE, tone]"
    :title="kind === 'model' ? `Active model: ${resultModel}` : undefined"
    data-testid="ai-status-badge"
  >
    <span
      v-if="kind === 'nano' || kind === 'local'"
      class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
    ></span>
    <Check v-if="kind === 'model'" class="h-2.5 w-2.5" />
    {{ kind === 'model' ? resultModel : LABELS[kind] }}
  </span>
</template>
