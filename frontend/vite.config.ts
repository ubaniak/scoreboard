import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Scoreboard',
        short_name: 'Scoreboard',
        description: 'Boxing tournament scoreboard for judges and admins',
        theme_color: '#0b0f1a',
        background_color: '#0b0f1a',
        display: 'standalone',
        orientation: 'any',
        id: '/',
        scope: '/',
        start_url: '/',
        categories: ['sports', 'utilities'],
        // PNG sizes are what Chrome/Android require for the install prompt
        // and splash screen; iOS uses apple-touch-icon.png from index.html.
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // Don't cache API responses — judges need live data
        globPatterns: ['**/*.{js,css,html,svg,png,ico,mp3,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        runtimeCaching: [
          {
            urlPattern: /^.*\/api\/.*$/,
            handler: 'NetworkOnly',
          },
          {
            // Athlete/club images: show cached copies instantly, refresh in background
            urlPattern: /^.*\/uploads\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'uploads',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/uploads': 'http://localhost:8080',
    },
  },
})
