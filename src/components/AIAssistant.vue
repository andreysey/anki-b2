<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Word } from '../types';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import { useAIRequest } from '../composables/useAIRequest';
import { AI_PROMPTS, type AIPromptType } from '../utils/aiPrompts';
import { Button } from './ui/button';
import { Sparkles, Settings, Compass, MessageSquare } from '@lucide/vue';
import AIResultCard from './AIResultCard.vue';
import AIStatusBadge from './AIStatusBadge.vue';
import {
  isModelReady,
  isModelLoading,
  modelLoadingProgress,
  modelLoadingText,
  isWebGPUSupported,
  isGenerating,
  generationStatus
} from '../utils/webllmState';

const props = defineProps<{
  word: Word;
}>();

const emit = defineEmits<{
  (e: 'ai-active', isActive: boolean): void;
}>();

const { hasNano, hasCloudKey, init, openSettings } = useAIAssistantState();
const request = useAIRequest();
const {
  isLoading,
  isError,
  resultText,
  resultSource,
  resultModel,
  isCopied,
  displayModelLabel,
  displaySourceLabel
} = request;

const hasCachedLocalModel = ref(false);

onMounted(async () => {
  init();
  if (isWebGPUSupported()) {
    const { isModelCached } = await import('../utils/webllm');
    hasCachedLocalModel.value = await isModelCached();
  }
});

const hasLocalModel = computed(() => isModelReady.value || hasCachedLocalModel.value);
// No AI backend configured yet: show the setup hint
const needsSetup = computed(() => !hasNano.value && !hasCloudKey.value && !hasLocalModel.value);
// WebGPU alone is enough to try: the first request downloads the local model
const canRequest = computed(() => !isLoading.value && (!needsSetup.value || isWebGPUSupported()));

// A new word cancels the running request and clears the answer
watch(
  () => props.word,
  () => {
    request.reset();
    emit('ai-active', false);
  }
);

watch([isLoading, resultText], ([loading, text]) => {
  emit('ai-active', loading || Boolean(text));
});

const ask = (type: AIPromptType) => {
  emit('ai-active', true);
  return request.run(type, AI_PROMPTS[type](props.word));
};

const loadingStatusText = computed(() => {
  if (isModelLoading.value) {
    return modelLoadingText.value || 'Downloading local model...';
  }
  return generationStatus.value || 'AI Coach analyzing context...';
});
</script>

<template>
  <div
    class="@container border-t border-slate-200/80 dark:border-white/10 pt-3.5 mt-2 flex flex-col w-full text-center"
  >
    <!-- AI Status & Settings Row -->
    <div class="flex items-center justify-between mb-2.5 px-0.5">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1"
        >
          <Sparkles class="h-3.5 w-3.5 text-primary-500" />
          AI Coach
        </span>
        <AIStatusBadge
          :has-nano="hasNano"
          :has-local-model="hasLocalModel"
          :result-model="resultModel"
          :has-cloud-key="hasCloudKey"
        />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        title="AI Settings"
        class="rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
        @click.stop="openSettings"
      >
        <Settings class="h-4 w-4" />
      </Button>
    </div>

    <!-- AI Action Pills -->
    <div class="grid grid-cols-1 @xs:grid-cols-2 gap-2 mb-3">
      <Button
        variant="outline"
        size="sm"
        :disabled="!canRequest"
        class="rounded-xl text-xs py-1.5 w-full justify-center"
        @click.stop="ask('grammar')"
      >
        <Compass class="h-3.5 w-3.5" />
        <span>Grammar Breakdown</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="!canRequest"
        class="rounded-xl text-xs py-1.5 w-full justify-center"
        @click.stop="ask('dialogue')"
      >
        <MessageSquare class="h-3.5 w-3.5" />
        <span>Workplace Dialogue</span>
      </Button>
    </div>

    <!-- Setup Prompt when AI is unconfigured -->
    <div
      v-if="needsSetup"
      class="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed"
    >
      Click the gear icon to download the <strong>Offline Local Model (~0.7–1.9 GB)</strong> or
      configure your free <strong>Gemini Cloud Key</strong>.
    </div>

    <!-- AI Output Card -->
    <AIResultCard
      v-if="isLoading || resultText"
      :is-loading="isLoading"
      :result-text="resultText"
      :is-error="isError"
      :is-copied="isCopied"
      :is-model-loading="isModelLoading"
      :loading-status-text="loadingStatusText"
      :model-loading-progress="modelLoadingProgress"
      :is-generating="isGenerating"
      :result-source="resultSource"
      :display-model-label="displayModelLabel"
      :display-source-label="displaySourceLabel"
      @copy="request.copy"
    />
  </div>
</template>
