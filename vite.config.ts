import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/anki-b2/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'data.json'],
      manifest: {
        name: 'Anki B2 - German Vocabulary',
        short_name: 'AnkiB2',
        description: 'Interactive Professional Vocabulary Dictionary',
        theme_color: '#0f172a',
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
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
             handler: 'CacheFirst',
             options: {
               cacheName: 'google-fonts-cache',
               expiration: {
                 maxEntries: 10,
                 maxAgeSeconds: 60 * 60 * 24 * 365
               },
               cacheableResponse: {
                 statuses: [0, 200]
               }
             }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
