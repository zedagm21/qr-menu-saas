import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

interface OfflineNoticeProps {
    isOnline: boolean;
    wasOffline: boolean;
    isAm?: boolean;
}

export const OfflineNotice: React.FC<OfflineNoticeProps> = ({ isOnline, wasOffline, isAm = false }) => {
    const { t } = useTranslation();
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        if (isOnline && wasOffline) {
            setShowRestored(true);
            const timer = setTimeout(() => {
                setShowRestored(false);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    if (isOnline && !showRestored) {
        return null;
    }

    if (!isOnline) {
        return (
            <aside
                aria-live="polite"
                aria-atomic="true"
                role="status"
                className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] transition-all duration-300 pointer-events-none"
            >
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md bg-neutral-900/90 dark:bg-neutral-800/90 text-amber-400 border border-amber-500/30 text-xs font-medium tracking-wide">
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span className={cn('whitespace-nowrap', isAm && 'font-ethiopic font-bold')}>
                        {t('offline.cached_notice', { defaultValue: 'Offline Mode • Browsing cached menu' })}
                    </span>
                </div>
            </aside>
        );
    }

    if (showRestored) {
        return (
            <aside
                aria-live="polite"
                aria-atomic="true"
                role="status"
                className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] transition-all duration-300 pointer-events-none"
            >
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 text-xs font-medium tracking-wide">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className={cn('whitespace-nowrap', isAm && 'font-ethiopic font-bold')}>
                        {t('offline.online_restored', { defaultValue: 'Connection restored • Menu updated' })}
                    </span>
                </div>
            </aside>
        );
    }

    return null;
};
