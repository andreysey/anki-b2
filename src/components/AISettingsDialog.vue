<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAIAssistantState } from '../composables/useAIAssistantState';
import AIKeySettings from './AIKeySettings.vue';
import LocalModelSettings from './LocalModelSettings.vue';

const { isSettingsOpen } = useAIAssistantState();
</script>

<template>
  <Dialog v-model:open="isSettingsOpen">
    <DialogContent class="@container max-w-105 w-[90vw]">
      <DialogHeader>
        <DialogTitle>AI Assistant Setup</DialogTitle>
        <DialogDescription>
          Configure on-device inference via Google Chrome or a secure cloud connection to the Gemini
          API.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 pt-1">
        <AIKeySettings />
        <LocalModelSettings />

        <!-- Chrome Built-in Prompt API Note -->
        <div class="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-1.5">
          <div
            class="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            Chrome Built-in Gemini Nano
          </div>
          <div class="text-[11px] text-slate-500 leading-relaxed">
            Used automatically first when Chrome's on-device model is available, with no extra
            download. On-device and local models answer in English; the Gemini API answers in
            Ukrainian.
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
