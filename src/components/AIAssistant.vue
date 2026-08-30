<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Word } from '../types';
import { callAI } from '../utils/ai';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import { Button } from './ui/button';
import {
  Sparkles,
  Settings,
  Compass,
  MessageSquare,
  Copy,
  Check
} from 'lucide-vue-next';
import { sanitizeHtml } from '../utils/sanitize';
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

    <!-- AI Output Card (Seamless, Single Outer Scrollbar) -->
    <div
      v-if="isLoading || resultText"
      role="status"
      aria-live="polite"
      class="relative mt-2 p-3.5 rounded-2xl text-left flex flex-col transition-all border shadow-inner"
      :class="
        isError
          ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
          : 'bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
      "
    >
      <!-- Quick Utility Action: Copy to Clipboard -->
      <div v-if="!isLoading && resultText" class="flex items-center justify-end gap-1 mb-1.5">
        <Button
          variant="ghost"
          size="icon-sm"
          @click.stop="handleCopy"
          :title="isCopied ? 'Copied!' : 'Copy text to clipboard'"
          aria-label="Copy text to clipboard"
          :class="isCopied ? 'text-emerald-500 font-bold' : 'text-slate-600 dark:text-slate-300'"
        >
          <component :is="isCopied ? Check : Copy" class="h-3.5 w-3.5" />
        </Button>
      </div>

      <!-- Loading indicator & Real-time Thinking Status -->
      <div v-if="isLoading && !resultText" class="flex flex-col items-center justify-center py-6 gap-2.5 flex-1">
        <Sparkles class="h-5 w-5 text-primary-500 animate-spin" />
        <span class="text-xs text-slate-600 dark:text-slate-300 font-medium animate-pulse">
          {{
            isModelLoading
              ? (modelLoadingText || 'Downloading local model...')
              : (generationStatus || 'AI Coach analyzing context...')
          }}
        </span>
        <div v-if="isModelLoading" class="w-48 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            class="bg-primary-500 h-full transition-all duration-300 rounded-full"
            :style="{ width: `${modelLoadingProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Output Text (Live Streaming tokens & completed response) -->
      <div v-else class="text-xs leading-relaxed font-sans pr-1">
        <div
          class="whitespace-pre-wrap select-text font-normal text-slate-800 dark:text-slate-200"
          v-html="sanitizeHtml(resultText)"
        ></div>
        <span
          v-if="isLoading && isGenerating"
          class="inline-block w-1.5 h-3.5 ml-1 bg-primary-500 animate-pulse align-middle rounded-xs"
        ></span>
      </div>

      <!-- Footer with Model Badge & Source Details -->
      <div
        v-if="!isLoading && resultSource !== 'none'"
        class="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400"
      >
        <div
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9.5px] font-semibold bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200"
        >
          <Sparkles class="h-2.5 w-2.5 text-primary-500" />
          <span>{{
            resultModel || (resultSource === 'nano' ? 'gemini-nano' : resultSource === 'webllm' ? 'smollm2-local' : 'gemini-cloud')
          }}</span>
        </div>
        <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
          {{ resultSource === 'nano' ? 'On-Device AI' : resultSource === 'webllm' ? 'WebGPU Local AI' : 'Cloud API' }}
        </span>
      </div>
    </div>
  </div>
</template>
