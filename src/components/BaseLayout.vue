<script setup lang="ts">
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';

defineProps<{
  appVersion: string;
}>();
</script>

<template>
  <div class="min-h-screen bg-surface-950/20 antialiased selection:bg-primary-500/30 w-full overflow-x-hidden">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-md border-b border-surface-800 w-full flex justify-center">
      <div class="max-w-[1280px] w-full !mx-auto !px-6 sm:!px-12 lg:!px-16 h-16 flex items-center justify-between">
        <div class="flex items-center">
          <slot name="header-start">
            <div class="flex items-center gap-3">
              <div class="bg-primary p-2 rounded-lg">
                <i class="pi pi-book text-xl text-primary-contrast" />
              </div>
              <div>
                <h1 class="text-xl font-bold tracking-tight">Anki B2</h1>
                <p class="text-[0.65rem] uppercase tracking-widest text-surface-500 font-bold leading-none">Berufsvokabular</p>
              </div>
            </div>
          </slot>
        </div>
        <div class="flex items-center">
          <slot name="header-end" />
        </div>
      </div>
    </header>

    <!-- Content Wrapper with Centering -->
    <div class="w-full flex justify-center min-h-[calc(100vh-64px)]">
      <div class="max-w-[1280px] w-full !mx-auto !px-6 sm:!px-12 lg:!px-16 py-12 sm:py-20 flex flex-col flex-grow">
        <main class="flex-grow flex flex-col gap-12">
          <slot />
        </main>

        <!-- Footer (Inside the centered container to match alignment) -->
        <footer class="mt-20 pb-12">
          <Divider />
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 text-surface-500">
              <p class="text-sm">© 2024 Anki B2 - Professional Vocabulary</p>
              <div class="flex items-center gap-4">
                <Tag :value="'v' + appVersion" severity="secondary" rounded />
              </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>
