<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '../utils';
import { badgeVariants, type BadgeVariants } from './index';

interface Props {
  variant?: BadgeVariants['variant'];
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
