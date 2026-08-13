<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Word } from '../types';
import { callAI } from '../utils/ai';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import Button from 'primevue/button';
import ScrollPanel from 'primevue/scrollpanel';
import { sanitizeHtml } from '../utils/sanitize';

const props = defineProps<{
  word: Word;
}>();

const { hasNano, hasCloudKey, init, openSettings } = useAIAssistantState();

const isLoading = ref(false);
const isError = ref(false);
const resultText = ref('');
const resultSource = ref<'nano' | 'cloud' | 'none'>('none');
const resultModel = ref<string>('');
const explanationType = ref<'grammar' | 'dialogue' | null>(null);

onMounted(() => {
  init();
});

const handleExplainGrammar = async () => {
  explanationType.value = 'grammar';
  isLoading.value = true;
  isError.value = false;
  resultText.value = '';
  resultModel.value = '';
  
  const systemInstruction = 
    "You are a professional telc Deutsch B2 Beruf language coach. " +
    "Analyze the German vocabulary term and its example sentence. " +
    "Explain in Ukrainian (keep it brief and highly readable): " +
    "1. Underline the vocabulary meaning/preposition context in this sentence. " +
    "2. Explain any important grammar elements used (like prepositions, cases, or Nomen-Verb-Verbindungen). " +
    "Use bullet points and bold text where appropriate.";

  const prompt = 
    `Vocabulary Term: ${props.word.german}\n` +
    `Example Sentence: ${props.word.example || 'None'}\n\n` +
    `Please parse and explain the grammar structure.`;

  const res = await callAI(prompt, systemInstruction);
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

  const systemInstruction = 
    "You are a professional telc Deutsch B2 Beruf language coach. " +
    "Generate a short corporate/workplace dialogue in German (2-4 turns) demonstrating the practical use of the target word. " +
    "Include a brief Ukrainian translation underneath each line. " +
    "Bold the target German vocabulary word inside the dialogue.";

  const prompt = 
    `Vocabulary Term: ${props.word.german}\n` +
    `Context: Business/Professional (B2 Beruf)\n\n` +
    `Create a practical workplace dialog.`;

  const res = await callAI(prompt, systemInstruction);
  resultText.value = res.text;
  resultSource.value = res.source;
  resultModel.value = res.model || '';
  isError.value = !res.success;
  isLoading.value = false;
};
</script>

<template>
  <div class="mt-4 border-t border-slate-200 dark:border-white/10 pt-4 w-full">
    <!-- Header status and settings button -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Coach</span>
        <span 
          v-if="hasNano" 
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          Gemini Nano
        </span>
        <span 
          v-else-if="resultModel"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
          :title="`Active model: ${resultModel}`"
        >
          <i class="pi pi-check text-[9px]"></i>
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
        icon="pi pi-cog" 
        severity="secondary" 
        rounded
        text 
        size="small" 
        @click.stop="openSettings" 
        title="AI Settings"
        class="hover:bg-slate-200/60 dark:hover:bg-white/10 active:scale-95 transition-all w-7 h-7"
      />
    </div>

    <!-- AI Action Pills -->
    <div class="flex gap-2.5 mb-3 justify-center">
      <Button 
        label="Grammar Breakdown" 
        icon="pi pi-compass" 
        severity="secondary" 
        size="small" 
        outlined
        @click.stop="handleExplainGrammar"
        :disabled="isLoading || (!hasNano && !hasCloudKey)"
        class="!rounded-xl text-xs active:scale-95 transition-all !py-1.5"
      />
      <Button 
        label="Workplace Dialogue" 
        icon="pi pi-comments" 
        severity="secondary" 
        size="small" 
        outlined
        @click.stop="handleGenerateDialogue"
        :disabled="isLoading || (!hasNano && !hasCloudKey)"
        class="!rounded-xl text-xs active:scale-95 transition-all !py-1.5"
      />
    </div>

    <!-- Setup Prompt when AI is unconfigured -->
    <div v-if="!hasNano && !hasCloudKey" class="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 text-center leading-relaxed">
      Click the gear icon to configure your free <strong>Gemini Cloud API Key</strong>, or use Google Chrome with <strong>window.ai</strong> enabled.
    </div>

    <!-- AI Output Card with Apple Intelligence Glow -->
    <div 
      v-if="isLoading || resultText" 
      role="status"
      aria-live="polite"
      class="relative mt-2 p-3.5 rounded-2xl text-left max-h-[220px] overflow-hidden flex flex-col transition-all border shadow-inner"
      :class="isError ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-black/50 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'"
    >
      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-6 gap-2.5 flex-1">
        <i class="pi pi-spin pi-sparkles text-lg text-primary-500 dark:text-primary-400 animate-pulse"></i>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">Apple Intelligence analyzing context...</span>
      </div>
      <!-- Output Text -->
      <ScrollPanel v-else class="h-[170px] text-xs leading-relaxed font-sans pr-1">
        <div class="whitespace-pre-wrap select-text font-normal text-slate-800 dark:text-slate-200" v-html="sanitizeHtml(resultText)"></div>
      </ScrollPanel>
      
      <!-- Footer with Model Badge & Source Details -->
      <div v-if="!isLoading && resultSource !== 'none'" class="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9.5px] font-semibold bg-slate-200/80 dark:bg-white/10 text-slate-800 dark:text-slate-200">
          <i class="pi pi-sparkles text-[8.5px] text-primary-500"></i>
          <span>{{ resultModel || (resultSource === 'nano' ? 'gemini-nano' : 'gemini-cloud') }}</span>
        </div>
        <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
          {{ resultSource === 'nano' ? 'On-Device AI' : 'Cloud API' }}
        </span>
      </div>
    </div>
  </div>
</template>
