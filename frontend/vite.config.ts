import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'favicon.svg',
                'apple-touch-icon.png',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'pwa-maskable-512x512.png',
            ],
            manifest: {
                name: 'OurMenu',
                short_name: 'OurMenu',
                description: 'Manage your digital menu, categories, QR codes, and analytics on the go.',
                theme_color: '#D97706',
                background_color: '#111111',
                display: 'standalone',
                scope: '/',
                start_url: '/dashboard',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-maskable-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        // 1. Google Fonts stylesheets
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // 2. Google Fonts webfonts (immutable font binaries)
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // 3. Public diner restaurant & menu API responses (Passive cache)
                        urlPattern: /\/api\/public\/restaurants\/[^\/]+(?:\/menu)?(?:\?.*)?$/i,
                        method: 'GET',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'diner-menu-api-cache',
                            networkTimeoutSeconds: 3,
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                            },
                        },
                    },
                    {
                        // 4. Restaurant Owner Dashboard APIs (Offline access)
                        urlPattern: /\/api\/(?:restaurant(?:s)?|categories|menu-items|qr)(?:\/.*)?$/i,
                        method: 'GET',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'dashboard-api-cache',
                            networkTimeoutSeconds: 3,
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days (604800 seconds)
                            },
                        },
                    },
                    {
                        // 5. Dish photos, logos, covers (local /uploads/ or remote CDN / Cloudflare R2 / Unsplash)
                        urlPattern: /(?:\/uploads\/|\.(?:png|jpg|jpeg|svg|webp|avif|gif)(?:\?.*)?$|r2\.cloudflarestorage|images\.unsplash)/i,
                        method: 'GET',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'diner-images-cache',
                            expiration: {
                                maxEntries: 300,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        // 6. Background Sync for Analytics (POST requests)
                        urlPattern: /\/api\/public\/restaurants\/[^\/]+\/(?:scan|item-click|search|interaction)$/i,
                        method: 'POST',
                        handler: 'NetworkOnly',
                        options: {
                            backgroundSync: {
                                name: 'analytics-sync-queue',
                                options: {
                                    maxRetentionTime: 24 * 60, // Retry for up to 24 hours
                                },
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true, // Exposes the server on local Wi-Fi IP (0.0.0.0)
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
