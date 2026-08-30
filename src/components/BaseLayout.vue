<script setup lang="ts">
import { Badge } from './ui/badge';
import { BookOpen } from 'lucide-vue-next';

defineProps<{
  appVersion: string;
}>();

const currentYear = new Date().getFullYear();
</script>

<template>
  <div
    class="min-h-screen bg-slate-50/50 dark:bg-slate-950 antialiased selection:bg-primary-500/30 w-full overflow-x-hidden"
  >
    <!-- Header -->
    <header
      class="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 w-full flex justify-center"
    >
      <div
        class="max-w-7xl w-full mx-auto px-6 sm:px-12 lg:px-16 h-16 flex items-center justify-between"
      >
        <div class="flex items-center">
          <slot name="header-start">
            <div class="flex items-center gap-3">
              <div class="bg-primary-600 p-2 rounded-xl text-white">
                <BookOpen class="h-5 w-5" />
              </div>
              <div>
                <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Anki B2</h1>
                <p
                  class="text-[0.65rem] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold leading-none"
                >
                  Berufsvokabular
                </p>
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
      <div
        class="max-w-7xl w-full mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-20 flex flex-col grow"
      >
        <main class="grow flex flex-col gap-12">
          <slot />
        </main>

        <!-- Footer -->
        <footer class="mt-20 pb-12">
          <div class="h-px bg-slate-200/80 dark:bg-slate-800 w-full"></div>
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 text-slate-500 dark:text-slate-400"
          >
            <p class="text-sm">© {{ currentYear }} Anki B2 - Professional Vocabulary</p>
            <div class="flex items-center gap-4">
              <Badge variant="secondary">v{{ appVersion }}</Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>
