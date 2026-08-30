<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import {
  PopoverContent,
  type PopoverContentEmits,
  type PopoverContentProps,
  PopoverPortal,
  useForwardPropsEmits
} from 'reka-ui';
import { cn } from '../utils';

defineOptions({
  inheritAttrs: false
});

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 6
  }
);
const emits = defineEmits<PopoverContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'z-50 w-72 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-4 text-slate-900 dark:text-slate-100 shadow-xl backdrop-blur-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class
        )
      "
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
