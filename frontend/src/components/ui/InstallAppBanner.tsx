import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Share, Smartphone, PlusSquare, Sparkles, MoreVertical, Compass } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '../../vite-env';

export const InstallAppBanner: React.FC = () => {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
        typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null
    );
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Platform detection
    const [isApple, setIsApple] = useState(false);
    const [isIOSSafari, setIsIOSSafari] = useState(false);
    const [isIOSOther, setIsIOSOther] = useState(false);

    useEffect(() => {
        // 1. Check if already running in standalone mode
        const isAppStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as unknown as { standalone?: boolean }).standalone === true;

        if (isAppStandalone) {
            setIsStandalone(true);
            return;
        }

        // 2. Check if dismissed in this browser session
        const dismissed = sessionStorage.getItem('pwa_install_banner_dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        // 3. Detect iOS and Safari vs other iOS browsers
        const ua = window.navigator.userAgent.toLowerCase();
        const appleDevice =
            /iphone|ipad|ipod/.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        setIsApple(appleDevice);

        if (appleDevice) {
            const isSafariBrowser =
                /safari/.test(ua) && !/chrome|crios|fxios|edg|opr|opera|brave|snapchat|instagram|telegram/.test(ua);
            setIsIOSSafari(isSafariBrowser);
            setIsIOSOther(!isSafariBrowser);
        }

        // 4. Listen for globally captured or late-firing beforeinstallprompt
        const handlePromptReady = () => {
            if (window.__pwaDeferredPrompt) {
                setDeferredPrompt(window.__pwaDeferredPrompt);
            }
        };

        const handleDirectPrompt = (e: Event) => {
            e.preventDefault();
            window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsStandalone(true);
            setDeferredPrompt(null);
            window.__pwaDeferredPrompt = null;
            sessionStorage.removeItem('pwa_install_banner_dismissed');
        };

        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        window.addEventListener('beforeinstallprompt', handleDirectPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('pwa-installed', handleAppInstalled);

        // Check if global prompt was already attached
        if (window.__pwaDeferredPrompt) {
            setDeferredPrompt(window.__pwaDeferredPrompt);
        }

        return () => {
            window.removeEventListener('pwa-prompt-ready', handlePromptReady);
            window.removeEventListener('beforeinstallprompt', handleDirectPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('pwa-installed', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult.outcome === 'accepted') {
                    setDeferredPrompt(null);
                    window.__pwaDeferredPrompt = null;
                    setIsStandalone(true);
                }
            } catch (err) {
                console.error('[InstallAppBanner] Prompt error:', err);
                setShowGuide(true);
            }
        } else {
            setShowGuide(!showGuide);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('pwa_install_banner_dismissed', 'true');
    };

    // If already installed or dismissed, hide banner
    if (isStandalone || isDismissed) {
        return null;
    }

    return (
        <div className="animate-fade-in-up delay-0 relative overflow-hidden backdrop-blur-md bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/15 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-amber-600/20 border border-amber-500/30 dark:border-amber-500/35 rounded-[22px] p-4 shadow-sm">
            {/* Dismiss button */}
            <button
                type="button"
                onClick={handleDismiss}
                aria-label={t('public.close', { defaultValue: 'Close' })}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
                {/* App Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/25 shrink-0 overflow-hidden p-1.5 border border-white/20">
                    <img
                        src="/pwa-192x192.png"
                        alt="App Icon"
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                    <Smartphone className="w-6 h-6 hidden" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {t('dashboard.pwa.badge', { defaultValue: 'Install App' })}
                        </span>
                    </div>

                    <h3 className="text-[15px] font-extrabold text-neutral-900 dark:text-white tracking-tight leading-snug">
                        OurMenu
                    </h3>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed font-medium">
                        {deferredPrompt
                            ? t('dashboard.pwa.desc', { defaultValue: 'Install on your device for quick offline access and standalone management.' })
                            : isIOSSafari
                            ? t('dashboard.pwa.ios_desc', { defaultValue: 'Install on your home screen for quick 1-tap restaurant access.' })
                            : isIOSOther
                            ? t('dashboard.pwa.ios_other_desc', { defaultValue: 'To install on your iPhone, open this page in Safari, tap the Share button, and choose "Add to Home Screen".' })
                            : t('dashboard.pwa.android_fallback_desc', { defaultValue: 'Install this app on your phone for quick 1-tap access and offline menu editing.' })}
                    </p>
                </div>
            </div>

            {/* Action bar */}
            <div className="mt-3.5 pt-3 border-t border-amber-500/20 dark:border-amber-500/25 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {deferredPrompt
                        ? 'Android & Chrome'
                        : isIOSSafari
                        ? 'Safari on iOS'
                        : isIOSOther
                        ? 'iOS Browser'
                        : 'Mobile Browser'}
                </span>

                {isIOSOther ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-bold border border-amber-500/30">
                        <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Safari Required</span>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        {deferredPrompt ? (
                            <>
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('dashboard.pwa.install_button', { defaultValue: 'Install App' })}</span>
                            </>
                        ) : isIOSSafari ? (
                            <>
                                <Share className="w-3.5 h-3.5" />
                                <span>{showGuide ? t('dashboard.pwa.hide_guide', { defaultValue: 'Hide Steps' }) : t('dashboard.pwa.how_to_install', { defaultValue: 'How to Install' })}</span>
                            </>
                        ) : (
                            <>
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>{showGuide ? t('dashboard.pwa.hide_guide', { defaultValue: 'Hide Steps' }) : t('dashboard.pwa.how_to_install', { defaultValue: 'How to Install' })}</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* iOS Safari Step-by-Step Instructions Accordion */}
            {isIOSSafari && showGuide && (
                <div className="mt-3 p-3 rounded-xl bg-white/70 dark:bg-neutral-900/80 border border-amber-500/25 text-xs text-neutral-700 dark:text-neutral-200 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                        <span>{t('dashboard.pwa.ios_step1', { defaultValue: 'Tap the Share button at the bottom of Safari.' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                        <span>{t('dashboard.pwa.ios_step2', { defaultValue: 'Scroll down and select "Add to Home Screen".' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                        <span>{t('dashboard.pwa.ios_step3', { defaultValue: 'Tap "Add" in the top-right corner to finish.' })}</span>
                    </div>
                </div>
            )}

            {/* Android / Mobile Browser Fallback Instructions Accordion */}
            {!deferredPrompt && !isApple && showGuide && (
                <div className="mt-3 p-3 rounded-xl bg-white/70 dark:bg-neutral-900/80 border border-amber-500/25 text-xs text-neutral-700 dark:text-neutral-200 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                        <span>{t('dashboard.pwa.android_step1', { defaultValue: 'Tap the browser menu (⋮) in the top or bottom corner.' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                        <span>{t('dashboard.pwa.android_step2', { defaultValue: 'Select "Install app" or "Add to Home screen".' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                        <span>{t('dashboard.pwa.android_step3', { defaultValue: 'Confirm when prompted to add the app to your device.' })}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
