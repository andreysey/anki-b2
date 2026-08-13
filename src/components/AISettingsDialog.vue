<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useAIAssistantState } from '../composables/useAIAssistantState';

const { isSettingsOpen, apiKey, saveApiKey } = useAIAssistantState();
const localKey = ref(apiKey.value);

watch(isSettingsOpen, (open) => {
  if (open) {
    localKey.value = apiKey.value;
  }
});

const handleSave = () => {
  saveApiKey(localKey.value);
};
</script>

<template>
  <Dialog 
    v-model:visible="isSettingsOpen" 
    modal 
    :blockScroll="false"
    :dismissableMask="true"
    header="AI Assistant Setup" 
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <div class="space-y-4 pt-2">
      <p class="text-sm text-surface-400 leading-normal">
        This feature supports local on-device inference via Google Chrome or a secure cloud connection to the Gemini API.
      </p>

      <div class="flex flex-col gap-2">
        <label for="apiKeyInput" class="text-xs font-bold uppercase tracking-wider text-surface-300">Gemini API Key</label>
        <div class="flex gap-2">
          <InputText 
            id="apiKeyInput" 
            v-model="localKey" 
            placeholder="Paste AI Studio API Key..." 
            class="flex-1" 
            type="password"
          />
          <Button label="Save" severity="primary" @click="handleSave" />
        </div>
        <span class="text-[10px] text-surface-500">
          Keys are saved strictly on your device inside LocalStorage. Get a free API Key on 
          <a href="https://aistudio.google.com/" target="_blank" class="text-primary underline">Google AI Studio</a>.
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
</template>
