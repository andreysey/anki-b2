<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Word } from '../types';
import { callAI, checkOnDeviceSupport, getCloudKey, setCloudKey } from '../utils/ai';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import ScrollPanel from 'primevue/scrollpanel';
import { sanitizeHtml } from '../utils/sanitize';

const props = defineProps<{
  word: Word;
}>();

const hasNano = ref(false);
const hasCloudKey = ref(false);
const apiKey = ref('');
const showSettings = ref(false);
const isLoading = ref(false);
const resultText = ref('');
const resultSource = ref<'nano' | 'cloud' | 'none'>('none');
const explanationType = ref<'grammar' | 'dialogue' | null>(null);

const checkAvailability = async () => {
  hasNano.value = await checkOnDeviceSupport();
  apiKey.value = getCloudKey();
  hasCloudKey.value = !!apiKey.value;
};

onMounted(() => {
  checkAvailability();
});

const saveApiKey = () => {
  setCloudKey(apiKey.value);
  hasCloudKey.value = !!apiKey.value;
  showSettings.value = false;
};

const handleExplainGrammar = async () => {
  explanationType.value = 'grammar';
  isLoading.value = true;
  resultText.value = '';
  
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
  isLoading.value = false;
};

const handleGenerateDialogue = async () => {
  explanationType.value = 'dialogue';
  isLoading.value = true;
  resultText.value = '';

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
  isLoading.value = false;
};
</script>

<template>
  <div class="mt-4 border-t border-surface-800 pt-4 w-full">
    <!-- Header status and settings button -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-surface-400">AI Assistance:</span>
        <span 
          v-if="hasNano" 
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20"
        >
          <span class="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
          Gemini Nano (Local)
        </span>
        <span 
          v-else-if="hasCloudKey" 
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"
        >
          Gemini Cloud (Active)
        </span>
        <span 
          v-else 
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        >
          Setup Required
        </span>
      </div>
      <Button 
        icon="pi pi-cog" 
        severity="secondary" 
        text 
        size="small" 
        @click.stop="showSettings = true" 
        title="AI Settings"
      />
    </div>

    <!-- AI Actions -->
    <div class="flex gap-2 mb-4 justify-center">
      <Button 
        label="Grammar Breakdown" 
        icon="pi pi-compass" 
        severity="secondary" 
        size="small" 
        outlined
        @click.stop="handleExplainGrammar"
        :disabled="isLoading || (!hasNano && !hasCloudKey)"
      />
      <Button 
        label="Workplace Dialogue" 
        icon="pi pi-comments" 
        severity="secondary" 
        size="small" 
        outlined
        @click.stop="handleGenerateDialogue"
        :disabled="isLoading || (!hasNano && !hasCloudKey)"
      />
    </div>

    <!-- Instructions when AI is not ready -->
    <div v-if="!hasNano && !hasCloudKey" class="p-3 bg-surface-900/60 border border-surface-800 rounded-xl text-xs text-surface-400 text-center">
      To use AI features, click the gear icon to configure your free <strong>Gemini Cloud API Key</strong>, or use Google Chrome with <strong>window.ai</strong> enabled.
    </div>

    <!-- AI Output Box -->
    <div v-if="isLoading || resultText" class="relative mt-2 p-4 bg-surface-950/80 border border-surface-800/80 rounded-2xl shadow-inner text-left max-h-[220px] overflow-hidden flex flex-col">
      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-6 gap-3 flex-1">
        <i class="pi pi-spin pi-sparkles text-xl text-primary"></i>
        <span class="text-xs text-surface-400 font-medium">Gemini is formulating explanation...</span>
      </div>
      <!-- Output Text -->
      <ScrollPanel v-else class="h-[180px] text-xs sm:text-sm text-surface-200 leading-relaxed font-sans pr-2">
        <div class="whitespace-pre-wrap select-text font-normal" v-html="sanitizeHtml(resultText)"></div>
      </ScrollPanel>
      <div v-if="!isLoading && resultSource !== 'none'" class="mt-2 text-[9px] text-surface-500 text-right uppercase tracking-wider font-semibold">
        Generated via {{ resultSource === 'nano' ? 'Local Gemini Nano' : 'Google Cloud API' }}
      </div>
    </div>

    <!-- Settings Dialog -->
    <Dialog 
      v-model:visible="showSettings" 
      modal 
      header="AI Assistant Setup" 
      :style="{ width: '90vw', maxWidth: '400px' }"
      @click.stop
    >
      <div class="space-y-4 pt-2">
        <p class="text-sm text-surface-400 leading-normal">
          This feature supports local on-device inference via Google Chrome or a secure cloud connection to the Gemini API.
        </p>

        <div class="flex flex-col gap-2">
          <label for="apiKey" class="text-xs font-bold uppercase tracking-wider text-surface-300">Gemini API Key</label>
          <div class="flex gap-2">
            <InputText 
              id="apiKey" 
              v-model="apiKey" 
              placeholder="Paste AI Studio API Key..." 
              class="flex-1" 
              type="password"
              @click.stop
            />
            <Button label="Save" severity="primary" @click="saveApiKey" />
          </div>
          <span class="text-[10px] text-surface-500">
            Keys are saved strictly on your device inside LocalStorage. Get a free API Key on 
            <a href="https://aistudio.google.com/" target="_blank" class="text-primary underline" @click.stop>Google AI Studio</a>.
          </span>
        </div>

        <div class="border-t border-surface-800 pt-3 mt-4 space-y-2">
          <div class="text-xs font-bold uppercase tracking-wider text-surface-300">Using Chrome window.ai</div>
          <div class="text-[11px] text-surface-500 leading-relaxed">
            Ensure you run Chrome 148+ with local Gemini Nano active. Alternatively, enable experimental Prompt API flags via <code class="bg-surface-900 px-1 py-0.5 rounded text-surface-300 font-mono">chrome://flags</code>.
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>
