<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner';
import { markToasterReady } from '../../../utils/notify';

const props = defineProps<ToasterProps>();

// Follow the app theme (the `dark` class on <html>), not just the OS setting
const isDark = () => document.documentElement.classList.contains('dark');
const theme = ref<'light' | 'dark'>(isDark() ? 'dark' : 'light');
const observer = new MutationObserver(() => (theme.value = isDark() ? 'dark' : 'light'));

onMounted(() => {
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  // Toasts fired before this point were waiting for the Toaster to exist
  markToasterReady();
});
onUnmounted(() => observer.disconnect());
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :theme="theme"
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-slate-900/95 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-200/80 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl font-sans',
        description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
        actionButton: 'group-[.toast]:bg-primary-600 group-[.toast]:text-white',
        closeButton:
          'group-[.toast]:bg-white dark:group-[.toast]:bg-slate-800 group-[.toast]:border-slate-200 dark:group-[.toast]:border-slate-700 group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-300 hover:group-[.toast]:text-slate-900 dark:hover:group-[.toast]:text-white',
        cancelButton:
          'group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300'
      }
    }"
  />
</template>
