<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2 } from '@lucide/vue';
import { useAIAssistantState } from '../composables/useAIAssistantState';

const { isSettingsOpen, apiKey, saveApiKey, removeApiKey } = useAIAssistantState();

// Edited copy of the key; unsaved edits are discarded when the dialog reopens
const localKey = ref(apiKey.value);
watch(isSettingsOpen, (open) => {
  if (open) localKey.value = apiKey.value;
});

// Address to allow in the key's "Websites" restriction, e.g. https://andreysey.github.io/anki-b2/*
const siteReferrer =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL}*`
    : 'https://andreysey.github.io/anki-b2/*';

const handleRemove = () => {
  removeApiKey();
  localKey.value = '';
};
</script>

<template>
  <div class="flex flex-col gap-2">
    <label
      for="apiKeyInput"
      class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
    >
      Gemini Cloud API Key
    </label>
    <div class="flex flex-col @xs:flex-row gap-2">
      <Input
        id="apiKeyInput"
        v-model="localKey"
        placeholder="Paste AI Studio API Key..."
        type="password"
        class="flex-1"
      />
      <div class="flex gap-2 shrink-0">
        <Button
          size="sm"
          @click="saveApiKey(localKey)"
          class="flex-1 @xs:flex-initial px-4 font-semibold"
        >
          Save
        </Button>
        <Button
          v-if="apiKey"
          variant="outline"
          size="sm"
          @click="handleRemove"
          title="Remove stored API key"
          class="text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 border-red-500/20"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>
    <span class="text-[10px] text-slate-500">
      Keys are stored locally in your browser. Get a free key on
      <a
        href="https://aistudio.google.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-600 dark:text-primary-400 underline hover:text-primary-500"
      >
        Google AI Studio </a
      >.
    </span>
    <details class="group text-[11px] text-slate-600 dark:text-slate-400">
      <summary
        class="cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
      >
        How to protect your key
      </summary>
      <ol class="list-decimal pl-4 mt-1.5 space-y-1 leading-relaxed">
        <li>
          Use a key from a project <strong>without billing</strong> — the free tier can't cost you
          money.
        </li>
        <li>
          In
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary-600 dark:text-primary-400 underline"
            >Google Cloud → Credentials</a
          >, open the key → <em>API restrictions</em> → allow only
          <strong>Generative Language API</strong>.
        </li>
        <li>
          Under <em>Application restrictions</em> choose <strong>Websites</strong> and add
          <code
            class="break-all bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]"
            >{{ siteReferrer }}</code
          >.
        </li>
      </ol>
    </details>
  </div>
</template>
