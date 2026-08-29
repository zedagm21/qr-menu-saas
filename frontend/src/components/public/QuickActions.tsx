import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Info,
    CreditCard,
    Wifi,
    X,
    Copy,
    Check,
    Eye,
    EyeOff,
    Phone,
    Mail,
    MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant } from '../../types';

export type QuickAction = 'info' | 'payment' | 'wifi' | null;

// ─── Quick Action Bar (Overlaid at bottom-left of hero cover image) ────────────
interface QuickActionBarProps {
    activeAction: QuickAction;
    onToggleAction: (action: 'info' | 'payment' | 'wifi') => void;
    hasInfo: boolean;
    hasPayment: boolean;
    hasWifi: boolean;
    isAm?: boolean;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
    activeAction,
    onToggleAction,
    hasInfo,
    hasPayment,
    hasWifi,
    isAm = false,
}) => {
    const { t } = useTranslation();

    if (!hasInfo && !hasPayment && !hasWifi) {
        return null;
    }

    return (
        <div
            className={cn(
                "absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 flex-wrap",
                isAm && "font-ethiopic"
            )}
            role="toolbar"
            aria-label={t('public.about_restaurant', { defaultValue: 'Quick Actions' })}
        >
            {hasInfo && (
                <button
                    type="button"
                    onClick={() => onToggleAction('info')}
                    aria-expanded={activeAction === 'info'}
                    aria-controls="quick-action-panel"
                    aria-label={t('public.quick_info', { defaultValue: 'Info' })}
                    className={cn(
                        "min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95",
                        activeAction === 'info'
                            ? "bg-[color:var(--color-brand-500)] text-white border border-[color:var(--color-brand-500)] shadow-md ring-2 ring-white/30"
                            : "bg-black/55 hover:bg-black/75 text-white/95 border border-white/20 backdrop-blur-md shadow-xs hover:border-white/40"
                    )}
                >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{t('public.quick_info', { defaultValue: 'Info' })}</span>
                </button>
            )}

            {hasPayment && (
                <button
                    type="button"
                    onClick={() => onToggleAction('payment')}
                    aria-expanded={activeAction === 'payment'}
                    aria-controls="quick-action-panel"
                    aria-label={t('public.quick_payment', { defaultValue: 'Payment' })}
                    className={cn(
                        "min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95",
                        activeAction === 'payment'
                            ? "bg-[color:var(--color-brand-500)] text-white border border-[color:var(--color-brand-500)] shadow-md ring-2 ring-white/30"
                            : "bg-black/55 hover:bg-black/75 text-white/95 border border-white/20 backdrop-blur-md shadow-xs hover:border-white/40"
                    )}
                >
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{t('public.quick_payment', { defaultValue: 'Payment' })}</span>
                </button>
            )}

            {hasWifi && (
                <button
                    type="button"
                    onClick={() => onToggleAction('wifi')}
                    aria-expanded={activeAction === 'wifi'}
                    aria-controls="quick-action-panel"
                    aria-label={t('public.quick_wifi', { defaultValue: 'Wi-Fi' })}
                    className={cn(
                        "min-h-[40px] sm:min-h-[44px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer select-none active:scale-95",
                        activeAction === 'wifi'
                            ? "bg-[color:var(--color-brand-500)] text-white border border-[color:var(--color-brand-500)] shadow-md ring-2 ring-white/30"
                            : "bg-black/55 hover:bg-black/75 text-white/95 border border-white/20 backdrop-blur-md shadow-xs hover:border-white/40"
                    )}
                >
                    <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{t('public.quick_wifi', { defaultValue: 'Wi-Fi' })}</span>
                </button>
            )}
        </div>
    );
};

// ─── Quick Action Panel (Displayed in normal document flow below hero) ─────────
interface QuickActionPanelProps {
    activeAction: 'info' | 'payment' | 'wifi';
    restaurant: Restaurant;
    onClose: () => void;
    isAm?: boolean;
    onCallClick?: () => void;
    onDirectionsClick?: () => void;
}

export const QuickActionPanel: React.FC<QuickActionPanelProps> = ({
    activeAction,
    restaurant,
    onClose,
    isAm = false,
    onCallClick,
    onDirectionsClick,
}) => {
    const { t } = useTranslation();
    const [showWifiPassword, setShowWifiPassword] = useState(false);
    const [copiedWifi, setCopiedWifi] = useState(false);
    const [copiedPayment, setCopiedPayment] = useState(false);

    const lang = isAm ? 'AM' : 'EN';
    const translations = restaurant.translations ?? [];
    const displayDesc = getTranslation(translations, lang, 'description') || restaurant.description || '';
    const displayAddress = getTranslation(translations, lang, 'address') || restaurant.address || '';
    const displayCity = getTranslation(translations, lang, 'city') || restaurant.city || '';

    const handleCopyWifiPassword = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!restaurant.wifiPassword) return;
        navigator.clipboard.writeText(restaurant.wifiPassword);
        setCopiedWifi(true);
        toast.success(t('public.copied', { defaultValue: 'Copied to clipboard!' }), { id: 'quick-wifi-copied' });
        setTimeout(() => setCopiedWifi(false), 2500);
    };

    const handleCopyPaymentInfo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!restaurant.paymentInfo) return;
        navigator.clipboard.writeText(restaurant.paymentInfo);
        setCopiedPayment(true);
        toast.success(t('public.copied_details', { defaultValue: 'Copied to clipboard!' }), { id: 'quick-pay-copied' });
        setTimeout(() => setCopiedPayment(false), 2500);
    };

    return (
        <section
            id="quick-action-panel"
            aria-live="polite"
            className={cn(
                "bg-white dark:bg-[#161616] border-b border-black/5 dark:border-[#2A2A2A] shadow-xs animate-slide-down transition-colors",
                isAm && "font-ethiopic"
            )}
        >
            <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-3.5 sm:py-4">
                {/* ─── Header with Title & Dismiss ─── */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-100 dark:border-[#222222]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-500)] flex items-center justify-center">
                            {activeAction === 'info' && <Info className="w-3.5 h-3.5" />}
                            {activeAction === 'payment' && <CreditCard className="w-3.5 h-3.5" />}
                            {activeAction === 'wifi' && <Wifi className="w-3.5 h-3.5" />}
                        </div>
                        <h2 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-[#F5F5F5] tracking-tight">
                            {activeAction === 'info' && t('public.restaurant_info', { defaultValue: 'Restaurant Info' })}
                            {activeAction === 'payment' && t('public.payment_methods', { defaultValue: 'Payment Methods' })}
                            {activeAction === 'wifi' && t('public.wifi', { defaultValue: 'Guest Wi-Fi' })}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('public.close', { defaultValue: 'Close' })}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-[#F5F5F5] hover:bg-neutral-100 dark:hover:bg-[#222222] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ─── Panel Content ─── */}
                {activeAction === 'info' && (
                    <div className="space-y-3">
                        {displayDesc && (
                            <p className="text-neutral-700 dark:text-[#D4D4D4] text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words">
                                {displayDesc}
                            </p>
                        )}

                        {/* Contact details row */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                            {restaurant.phone && (
                                <a
                                    href={`tel:${restaurant.phone}`}
                                    onClick={() => onCallClick?.()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/70 dark:border-[#2E2E2E] text-xs font-semibold text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-500)] hover:border-[color:var(--color-brand-500)]/40 transition-colors"
                                >
                                    <Phone className="w-3.5 h-3.5 text-[color:var(--color-brand-500)] shrink-0" />
                                    <span className="break-all">{restaurant.phone}</span>
                                </a>
                            )}

                            {restaurant.email && (
                                <a
                                    href={`mailto:${restaurant.email}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/70 dark:border-[#2E2E2E] text-xs font-semibold text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] dark:hover:text-[color:var(--color-brand-500)] hover:border-[color:var(--color-brand-500)]/40 transition-colors"
                                >
                                    <Mail className="w-3.5 h-3.5 text-[color:var(--color-brand-500)] shrink-0" />
                                    <span className="truncate max-w-[200px] break-all">{restaurant.email}</span>
                                </a>
                            )}

                            {(displayAddress || displayCity || restaurant.country) && (
                                <div
                                    onClick={() => onDirectionsClick?.()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/70 dark:border-[#2E2E2E] text-xs font-semibold text-neutral-700 dark:text-[#D4D4D4] cursor-pointer hover:border-[color:var(--color-brand-500)]/40 transition-colors"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-[color:var(--color-brand-500)] shrink-0" />
                                    <span className="break-words">
                                        {[displayAddress, displayCity, restaurant.country === 'Ethiopia' && isAm ? 'ኢትዮጵያ' : restaurant.country].filter(Boolean).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {!displayDesc && !restaurant.phone && !restaurant.email && !displayAddress && (
                            <p className="text-xs text-neutral-400 dark:text-[#888888] italic">
                                {t('public.no_info', { defaultValue: 'No information provided.' })}
                            </p>
                        )}
                    </div>
                )}

                {activeAction === 'payment' && (
                    <div className="space-y-2.5">
                        {restaurant.paymentInfo ? (
                            <div className="relative group">
                                <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/70 dark:border-[#2E2E2E] text-xs sm:text-[13px] text-neutral-800 dark:text-[#E5E5E5] font-mono whitespace-pre-line leading-relaxed break-words select-text">
                                    {restaurant.paymentInfo}
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCopyPaymentInfo}
                                        className="min-h-[38px] px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg bg-[color:var(--color-brand-500)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer"
                                        aria-label={t('public.copy_all', { defaultValue: 'Copy Details' })}
                                    >
                                        {copiedPayment ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedPayment ? t('public.copied') : t('public.copy_all', { defaultValue: 'Copy Details' })}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-400 dark:text-[#888888] italic">
                                {t('public.no_payment_info', { defaultValue: 'No payment methods configured.' })}
                            </p>
                        )}
                    </div>
                )}

                {activeAction === 'wifi' && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/70 dark:border-[#2E2E2E] space-y-2.5">
                        {restaurant.wifiName && (
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs text-neutral-500 dark:text-[#A3A3A3] font-semibold shrink-0">
                                    {t('public.wifi_network', { defaultValue: 'Wi-Fi Network' })}:
                                </span>
                                <span className="font-mono font-bold text-xs sm:text-[13px] text-neutral-900 dark:text-[#F5F5F5] break-all select-text">
                                    {restaurant.wifiName}
                                </span>
                            </div>
                        )}

                        {restaurant.wifiPassword && (
                            <div className={cn(
                                "flex items-center justify-between gap-2 flex-wrap pt-2",
                                restaurant.wifiName && "border-t border-neutral-200/60 dark:border-[#2A2A2A]"
                            )}>
                                <span className="text-xs text-neutral-500 dark:text-[#A3A3A3] font-semibold shrink-0">
                                    {t('public.wifi_password', { defaultValue: 'Wi-Fi Password' })}:
                                </span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono font-bold text-xs sm:text-[13px] text-neutral-900 dark:text-[#F5F5F5] bg-white dark:bg-[#141414] px-2.5 py-1 rounded-lg border border-neutral-200/80 dark:border-[#333333] select-text truncate max-w-[140px] sm:max-w-[200px]">
                                        {showWifiPassword ? restaurant.wifiPassword : '••••••••'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowWifiPassword(!showWifiPassword)}
                                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white dark:bg-[#141414] text-neutral-500 hover:text-neutral-800 dark:hover:text-[#F5F5F5] border border-neutral-200/80 dark:border-[#333333] transition-colors cursor-pointer shrink-0"
                                        aria-label={showWifiPassword ? t('public.hide_password') : t('public.show_password')}
                                    >
                                        {showWifiPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopyWifiPassword}
                                        className="min-h-[36px] px-2.5 sm:px-3 flex items-center gap-1.5 rounded-lg bg-[color:var(--color-brand-500)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                                        aria-label={t('public.copy_password', { defaultValue: 'Copy Password' })}
                                    >
                                        {copiedWifi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedWifi ? t('public.copied') : t('public.copy')}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {!restaurant.wifiName && !restaurant.wifiPassword && (
                            <p className="text-xs text-neutral-400 dark:text-[#888888] italic">
                                {t('public.no_wifi_info', { defaultValue: 'No Wi-Fi credentials configured.' })}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
