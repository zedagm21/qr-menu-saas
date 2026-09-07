import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardThemeProvider } from './contexts/DashboardThemeContext';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { initGlobalTelemetry } from './lib/telemetry';
import './i18n';
import './styles/globals.css';

// Initialize global crash and unhandled promise telemetry
initGlobalTelemetry();

// Auto-purge legacy dashboard API cache from previous service worker versions to ensure all devices fetch fresh data
if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((keys) => {
        keys.forEach((key) => {
            if (key.includes('dashboard-api-cache')) {
                caches.delete(key).catch(() => {});
            }
        });
    }).catch(() => {});
}

// Auto-reload when new deployment takes over an existing session
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    let isRefreshing = false;
    let hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController && !isRefreshing) {
            isRefreshing = true;
            // A previous service worker was replaced by a new deployment — reload!
            window.location.reload();
        }
    });
}

// Auto-reload on Vite chunk import failures caused by new deployment (with loop prevention guard)
window.addEventListener('vite:preloadError', async () => {
    const lastReload = sessionStorage.getItem('last_preload_reload');
    const now = Date.now();
    // Prevent reload loops if the chunk is genuinely 404 (cooldown of 10s)
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_preload_reload', String(now));
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            } catch {}
        }
        window.location.reload();
    }
});

// Automatically register service worker for offline caching and PWA functionality
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        // Activate waiting service worker immediately
        updateSW(true);
    },
    onRegisteredSW(_swScriptUrl, registration) {
        if (registration) {
            // Check for new deployments every 10 minutes
            setInterval(() => {
                registration.update().catch(() => {});
            }, 10 * 60 * 1000);

            // Check for updates whenever user returns to the tab or unlocks device
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    registration.update().catch(() => {});
                }
            });
        }
    },
});

// Global PWA beforeinstallprompt capture (before React renders)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e as any;
    window.dispatchEvent(new Event('pwa-prompt-ready'));
});

window.addEventListener('appinstalled', () => {
    window.__pwaDeferredPrompt = null;
    sessionStorage.removeItem('pwa_install_banner_dismissed');
    window.dispatchEvent(new Event('pwa-installed'));
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <GoogleOAuthProvider clientId={googleClientId}>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <AuthProvider>
                            <DashboardThemeProvider>
                                <App />
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        style: {
                                            background: '#1a1a1a',
                                            color: '#fff',
                                            fontSize: '14px',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                        },
                                        success: {
                                            duration: 4000,
                                            iconTheme: { primary: '#10b981', secondary: '#fff' },
                                        },
                                        error: {
                                            duration: 5000,
                                            iconTheme: { primary: '#ef4444', secondary: '#fff' },
                                        },
                                    }}
                                />
                            </DashboardThemeProvider>
                        </AuthProvider>
                    </BrowserRouter>
                </QueryClientProvider>
            </GoogleOAuthProvider>
        </HelmetProvider>
    </React.StrictMode>
);
