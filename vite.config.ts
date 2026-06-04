import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Dig It – Gardening Social',
        short_name: 'Dig It',
        description: "Share what's growing in your garden right now. Live camera only.",
        theme_color: '#2d6a4f',
        background_color: '#f0faf5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['social', 'lifestyle', 'photo'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: '/screenshots/feed.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Feed – see what your neighbors are growing',
          },
          {
            src: '/screenshots/map.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Map – explore gardens in your area',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.pravatar\.cc\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'avatars', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'post-images', expiration: { maxEntries: 100, maxAgeSeconds: 604800 } },
          },
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 604800 } },
          },
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'geocoding', expiration: { maxEntries: 20, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
})
