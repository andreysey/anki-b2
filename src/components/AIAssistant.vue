<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Word } from '../types';
import { callAI } from '../utils/ai';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import { Button } from './ui/button';
import {
  Sparkles,
  Settings,
  Compass,
  MessageSquare,
  Check
} from 'lucide-vue-next';
import AIResultCard from './AIResultCard.vue';
import {
  isModelReady,
  isModelLoading,
  modelLoadingProgress,
  modelLoadingText,
  isWebGPUSupported,
  isGenerating,
  generationStatus
} from '../utils/webllm';

const props = defineProps<{
  word: Word;
}>();

const emit = defineEmits<{
  (e: 'ai-active', isActive: boolean): void;
}>();

const { hasNano, hasCloudKey, init, openSettings } = useAIAssistantState();

const isLoading = ref(false);
const isError = ref(false);
const resultText = ref('');
const resultSource = ref<'nano' | 'webllm' | 'cloud' | 'none'>('none');
const resultModel = ref<string>('');
const explanationType = ref<'grammar' | 'dialogue' | null>(null);
const isCopied = ref(false);
const hasCachedLocalModel = ref(false);

onMounted(async () => {
  init();
  if (isWebGPUSupported()) {
    const { isModelCached } = await import('../utils/webllm');
    hasCachedLocalModel.value = await isModelCached();
  }
});

// Reset AI state when word changes
watch(
  () => props.word,
  () => {
    isLoading.value = false;
    isError.value = false;
    resultText.value = '';
    resultModel.value = '';
    resultSource.value = 'none';
    explanationType.value = null;
    isCopied.value = false;
    emit('ai-active', false);
  }
);

watch([isLoading, resultText], ([loading, text]) => {
  emit('ai-active', loading || Boolean(text));
});

const handleCopy = async () => {
  if (!resultText.value) return;
  try {
    const cleanText = resultText.value.replace(/<[^>]*>/g, '');
    await navigator.clipboard.writeText(cleanText);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.warn('Failed to copy AI text:', err);
  }
};

const handleExplainGrammar = async () => {
  explanationType.value = 'grammar';
  isLoading.value = true;
  isError.value = false;
  resultText.value = '';
  resultModel.value = '';
  isCopied.value = false;
  emit('ai-active', true);

  const systemInstruction =
    'You are a German language coach (CEFR B1/B2). ' +
    'Explain the German vocabulary term clearly in Ukrainian with bullet points. ' +
    'Do not repeat phrases. Be concise and structured.';

  const prompt =
    `German word: ${props.word.german}\n` +
    `Example: ${props.word.example || 'N/A'}\n\n` +
    `Task: Provide meaning and grammar notes in Ukrainian.`;

  const res = await callAI(prompt, systemInstruction, (_chunk, fullText) => {
    resultText.value = fullText;
  });
  resultText.value = res.text;
  resultSource.value = res.source;
  resultModel.value = res.model || '';
  isError.value = !res.success;
  isLoading.value = false;
};

const handleGenerateDialogue = async () => {
  explanationType.value = 'dialogue';
  isLoading.value = true;
  isError.value = false;
  resultText.value = '';
  resultModel.value = '';
  isCopied.value = false;
  emit('ai-active', true);

  const systemInstruction =
    'You are a German language coach. ' +
    'Write a concise 2-speaker German workplace dialogue (2-3 lines max) using the vocabulary word. ' +
    'Provide Ukrainian translation for each line. Do not repeat lines.';

  const prompt =
    `Word: ${props.word.german}\n` +
    `Format:\n` +
    `A: [German line]\n` +
    `  [Ukrainian translation]\n` +
    `B: [German line]\n` +
    `  [Ukrainian translation]`;

  const res = await callAI(prompt, systemInstruction, (_chunk, fullText) => {
    resultText.value = fullText;
  });
  resultText.value = res.text;
  resultSource.value = res.source;
  resultModel.value = res.model || '';
  isError.value = !res.success;
  isLoading.value = false;
};

const displayModelLabel = computed(() => {
  if (resultModel.value) return resultModel.value;
  if (resultSource.value === 'nano') return 'gemini-nano';
  if (resultSource.value === 'webllm') return 'smollm2-local';
  return 'gemini-cloud';
});

const displaySourceLabel = computed(() => {
  if (resultSource.value === 'nano') return 'On-Device AI';
  if (resultSource.value === 'webllm') return 'WebGPU Local AI';
  return 'Cloud API';
});

const loadingStatusText = computed(() => {
  if (isModelLoading.value) {
    return modelLoadingText.value || 'Downloading local model...';
  }
  return generationStatus.value || 'AI Coach analyzing context...';
});
</script>

<template>
  <div
    class="border-t border-slate-200/80 dark:border-white/10 pt-3.5 mt-2 flex flex-col w-full text-center"
  >
    <!-- AI Status & Settings Row -->
    <div class="flex items-center justify-between mb-2.5 px-0.5">
      <div class="flex items-center gap-1.5">
        <span
          class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1"
        >
          <Sparkles class="h-3.5 w-3.5 text-primary-500" />
          AI Coach
        </span>
        <span
          v-if="hasNano"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
        >
          <span
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
          ></span>
          Gemini Nano
        </span>
        <span
          v-else-if="isModelReady || hasCachedLocalModel"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
        >
          <span
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
          ></span>
          Local AI (Offline)
        </span>
        <span
          v-else-if="resultModel"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
          :title="`Active model: ${resultModel}`"
        >
          <Check class="h-2.5 w-2.5" />
          {{ resultModel }}
        </span>
        <span
          v-else-if="hasCloudKey"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
        >
          Gemini Cloud (Active)
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25"
        >
          Setup Required
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        @click.stop="openSettings"
        title="AI Settings"
        class="rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <Settings class="h-4 w-4" />
      </Button>
    </div>

    <!-- AI Action Pills -->
    <div class="flex gap-2.5 mb-3 justify-center">
      <Button
        variant="outline"
        size="sm"
        @click.stop="handleExplainGrammar"
        :disabled="isLoading || (!hasNano && !hasCloudKey && !isModelReady && !hasCachedLocalModel && !isWebGPUSupported())"
        class="rounded-xl text-xs py-1.5"
      >
        <Compass class="h-3.5 w-3.5" />
        <span>Grammar Breakdown</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click.stop="handleGenerateDialogue"
        :disabled="isLoading || (!hasNano && !hasCloudKey && !isModelReady && !hasCachedLocalModel && !isWebGPUSupported())"
        class="rounded-xl text-xs py-1.5"
      >
        <MessageSquare class="h-3.5 w-3.5" />
        <span>Workplace Dialogue</span>
      </Button>
    </div>

    <!-- Setup Prompt when AI is unconfigured -->
    <div
      v-if="!hasNano && !hasCloudKey && !isModelReady && !hasCachedLocalModel"
      class="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed"
    >
      Click the gear icon to download the <strong>Offline Local Model (~250MB)</strong> or configure your free <strong>Gemini Cloud Key</strong>.
    </div>

    <!-- AI Output Card -->
    <AIResultCard
      v-if="isLoading || resultText"
      :isLoading="isLoading"
      :resultText="resultText"
      :isError="isError"
      :isCopied="isCopied"
      :isModelLoading="isModelLoading"
      :loadingStatusText="loadingStatusText"
      :modelLoadingProgress="modelLoadingProgress"
      :isGenerating="isGenerating"
      :resultSource="resultSource"
      :displayModelLabel="displayModelLabel"
      :displaySourceLabel="displaySourceLabel"
      @copy="handleCopy"
    />
  </div>
</template>
