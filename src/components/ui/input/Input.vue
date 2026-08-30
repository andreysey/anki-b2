<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../utils';

interface Props {
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes['class'];
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void;
}>();
</script>

<template>
  <input
    :type="type"
    :value="modelValue ?? defaultValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="
      cn(
        'flex h-9 w-full rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
    @input="emits('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
