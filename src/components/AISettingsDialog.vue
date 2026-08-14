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
    :style="{ width: '90vw', maxWidth: '420px' }"
  >
    <div class="space-y-4 pt-1">
      <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Configure on-device inference via Google Chrome or a secure cloud connection to the Gemini
        API.
      </p>

      <div class="flex flex-col gap-2">
        <label
          for="apiKeyInput"
          class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >Gemini Cloud API Key</label
        >
        <div class="flex gap-2">
          <InputText
            id="apiKeyInput"
            v-model="localKey"
            placeholder="Paste AI Studio API Key..."
            class="flex-1 !rounded-xl text-xs !bg-slate-50 dark:!bg-black/40 !border-slate-200 dark:!border-white/15"
            type="password"
          />
          <Button
            label="Save"
            severity="primary"
            size="small"
            @click="handleSave"
            class="!rounded-xl text-xs font-semibold px-4 active:scale-95"
          />
        </div>
        <span class="text-[10px] text-slate-500">
          Keys are stored locally in your browser. Get a free key on
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            class="text-primary-600 dark:text-primary-400 underline hover:text-primary-500"
            >Google AI Studio</a
          >.
        </span>
      </div>

      <div class="border-t border-slate-200 dark:border-white/10 pt-3 mt-3 space-y-1.5">
        <div
          class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
        >
          On-Device Gemini Nano
        </div>
        <div class="text-[11px] text-slate-500 leading-relaxed">
          Ensure you run Chrome 148+ with local Gemini Nano active or enable Prompt API flags in
          <code
            class="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono text-[10px]"
            >chrome://flags</code
          >.
        </div>
      </div>
    </div>
  </Dialog>
</template>
