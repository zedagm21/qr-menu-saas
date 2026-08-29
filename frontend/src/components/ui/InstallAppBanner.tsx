import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Share, Smartphone, PlusSquare, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppBanner: React.FC = () => {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already running in standalone mode
        const isAppStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as unknown as { standalone?: boolean }).standalone === true;

        if (isAppStandalone) {
            setIsStandalone(true);
            return;
        }

        // Check if previously dismissed in this session
        const dismissed = sessionStorage.getItem('pwa_install_banner_dismissed');
        if (dismissed) {
            setIsDismissed(true);
        }

        // Detect iOS Safari
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|edg/.test(userAgent);
        if (isAppleDevice && isSafari) {
            setIsIOS(true);
        }

        // Listen for standard beforeinstallprompt on Chromium/Android
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setIsStandalone(true);
            setDeferredPrompt(null);
            sessionStorage.removeItem('pwa_install_banner_dismissed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsStandalone(true);
            }
        } else if (isIOS) {
            setShowIOSGuide(!showIOSGuide);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('pwa_install_banner_dismissed', 'true');
    };

    // If already installed or dismissed, or not on supported mobile browser, return null
    if (isStandalone || isDismissed || (!deferredPrompt && !isIOS)) {
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
                    <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-contain rounded-xl" onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }} />
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
                        QR Menu Manager
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed font-medium">
                        {isIOS
                            ? t('dashboard.pwa.ios_desc', { defaultValue: 'Install on your home screen for quick 1-tap restaurant access.' })
                            : t('dashboard.pwa.desc', { defaultValue: 'Install on your device for quick offline access and standalone management.' })}
                    </p>
                </div>
            </div>

            {/* Action button */}
            <div className="mt-3.5 pt-3 border-t border-amber-500/20 dark:border-amber-500/25 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                    {isIOS ? 'Safari on iOS' : 'Android & Chrome'}
                </span>

                <button
                    type="button"
                    onClick={handleInstallClick}
                    className="min-h-[38px] px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                    {isIOS ? (
                        <>
                            <Share className="w-3.5 h-3.5" />
                            <span>{showIOSGuide ? t('dashboard.pwa.hide_guide', { defaultValue: 'Hide Steps' }) : t('dashboard.pwa.how_to_install', { defaultValue: 'How to Install' })}</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-3.5 h-3.5" />
                            <span>{t('dashboard.pwa.install_button', { defaultValue: 'Install App' })}</span>
                        </>
                    )}
                </button>
            </div>

            {/* iOS Step-by-Step Instructions Accordion */}
            {isIOS && showIOSGuide && (
                <div className="mt-3 p-3 rounded-xl bg-white/70 dark:bg-neutral-900/80 border border-amber-500/25 text-xs text-neutral-700 dark:text-neutral-200 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">1</span>
                        <span>Tap the <strong className="font-semibold">Share button</strong> <Share className="w-3.5 h-3.5 inline mx-0.5 text-amber-600 dark:text-amber-400" /> at the bottom of Safari.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">2</span>
                        <span>Scroll down and select <strong className="font-semibold">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-600 dark:text-amber-400" />.</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[11px]">3</span>
                        <span>Tap <strong className="font-semibold">Add</strong> in the top-right corner to finish.</span>
                    </div>
                </div>
            )}
        </div>
    );
};
