/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const MEDIA_HOSTS =
  /^https:\/\/(drive\.usercontent\.google\.com|drive\.google\.com|[^/]*\.googleapis\.com)\//

export default defineConfig({
  base: process.env.VITE_BASE ?? '/playit/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'favicon.svg'],
      manifest: {
        name: 'playit',
        short_name: 'playit',
        description: 'Play audio and video shared from cloud storage.',
        theme_color: '#08080a',
        background_color: '#08080a',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Media is large and opaque. Never let Workbox near it.
        navigateFallbackDenylist: [MEDIA_HOSTS],
        runtimeCaching: [],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      // A proxy base so the Drive adapter resolves in tests. Individual tests
      // override this (and global fetch) when exercising other cases.
      VITE_DRIVE_PROXY: 'https://proxy.test',
    },
  },
})
