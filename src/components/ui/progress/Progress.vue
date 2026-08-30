<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps
} from 'reka-ui';
import { cn } from '../utils';

const props = withDefaults(
  defineProps<
    ProgressRootProps & {
      class?: HTMLAttributes['class'];
      indicatorClass?: HTMLAttributes['class'];
    }
  >(),
  {
    modelValue: 0
  }
);

const delegatedProps = computed(() => {
  const { class: _, indicatorClass: __, ...delegated } = props;
  return delegated;
});
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800',
        props.class
      )
    "
  >
    <ProgressIndicator
      :class="
        cn(
          'h-full w-full flex-1 bg-linear-to-r from-primary-500 to-emerald-400 transition-all duration-300 ease-out',
          props.indicatorClass
        )
      "
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>
