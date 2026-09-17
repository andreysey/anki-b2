<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner';

const props = defineProps<ToasterProps>();
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-slate-900/95 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-200/80 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl font-sans',
        description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
        actionButton:
          'group-[.toast]:bg-primary-600 group-[.toast]:text-white',
        cancelButton:
          'group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300'
      }
    }"
  />
</template>
