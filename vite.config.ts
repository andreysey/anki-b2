import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import pkg from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  base: '/anki-b2/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        // Generated shadcn primitives
        'src/components/ui/**',
        // Developer tools and CLI entry points (exercised by CI / by running them)
        'scripts/ui-audit.ts',
        'scripts/ci-status.ts',
        'scripts/diff-data.ts',
        'scripts/deck-worker.ts',
        'scripts/generate-all-anki.ts'
      ],
      // Fail when coverage drops noticeably below today's level (≈83/77/83/85)
      thresholds: { statements: 81, branches: 75, functions: 81, lines: 83 }
    }
  },
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'inline-css',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml(html, { bundle }) {
        if (!bundle) return html;
        let inlinedHtml = html;
        for (const [fileName, file] of Object.entries(bundle)) {
          if (fileName.endsWith('.css') && 'source' in file) {
            const cssContent =
              typeof file.source === 'string' ? file.source : file.source.toString();
            // Replace external <link rel="stylesheet" ...> with <style>...</style>
            const linkRegex = new RegExp(
              `<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*${fileName}[^"']*["'][^>]*>`,
              'i'
            );
            if (linkRegex.test(inlinedHtml)) {
              inlinedHtml = inlinedHtml.replace(linkRegex, `<style>${cssContent}</style>`);
              delete bundle[fileName];
            }
          }
        }
        return inlinedHtml;
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      // Icons are already precached by globPatterns below
      includeManifestIcons: false,
      manifest: {
        id: '/anki-b2/',
        name: 'Anki B2 - German Vocabulary',
        short_name: 'AnkiB2',
        description:
          'German B1+/B2 Beruf vocabulary trainer with spaced repetition, audio and AI explanations. Works offline.',
        categories: ['education'],
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            // Padded copy for Android's round/squircle icon masks
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Study Cards',
            short_name: 'Study',
            description: 'Start your active flashcard review session',
            url: '/anki-b2/#study',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Dashboard & Stats',
            short_name: 'Dashboard',
            description: 'View Leitner boxes, progress and metrics',
            url: '/anki-b2/#dashboard',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Dictionary Search',
            short_name: 'Dictionary',
            description: 'Browse and search vocabulary list',
            url: '/anki-b2/',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Everything incl. data.json is precached, so each release updates app and words together
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // The local-AI engine (~6 MB) is only downloaded by people who turn it on
        globIgnores: ['**/vendor-webllm*.js'],
        // Control the page on the first visit, so it works offline without a reload
        clientsClaim: true
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/@mlc-ai/web-llm/')) {
            return 'vendor-webllm';
          }
        }
      }
    }
  }
});
