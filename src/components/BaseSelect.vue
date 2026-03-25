<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  placeholder?: string;
}>();

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="base-select-wrapper">
    <select 
      :value="modelValue" 
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      class="base-select"
    >
      <option v-if="placeholder" value="all">{{ placeholder }}</option>
      <slot></slot>
    </select>
    <div class="select-icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.base-select-wrapper {
  position: relative;
  display: flex;
  flex: 1;
}

.base-select {
  width: 100%;
  padding: 0.6rem 2.8rem 0.6rem 1rem; /* Extra right padding for the icon */
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  font-size: 0.95rem;
  appearance: none;
  transition: all 0.2s ease;
}

.base-select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.select-icon {
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.2rem;
  height: 1.2rem;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.5);
}

.select-icon svg {
  width: 100%;
  height: 100%;
}
</style>
