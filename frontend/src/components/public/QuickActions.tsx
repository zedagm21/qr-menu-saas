import React, { useState, useEffect } from 'react';
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
    Share2,
    Facebook,
    Instagram,
    Youtube,
    Linkedin,
    Twitter,
    MessageCircle,
    Send,
    Globe,
    Link2,
    ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant, SocialMediaEntry } from '../../types';

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

// ─── Quick Action Modal / Bottom Sheet (Pop-up Overlay) ───────────────────────
interface QuickActionModalProps {
    isOpen: boolean;
    activeAction: 'info' | 'payment' | 'wifi';
    onChangeAction?: (action: 'info' | 'payment' | 'wifi') => void;
    restaurant: Restaurant | null;
    onClose: () => void;
    isAm?: boolean;
    onCallClick?: () => void;
    onDirectionsClick?: () => void;
    onSocialClick?: (platform: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
    isOpen,
    activeAction,
    onChangeAction,
    restaurant,
    onClose,
    isAm = false,
    onCallClick,
    onDirectionsClick,
    onSocialClick,
}) => {
    const { t } = useTranslation();
    const [showWifiPassword, setShowWifiPassword] = useState(false);
    const [copiedWifi, setCopiedWifi] = useState(false);
    const [copiedPayment, setCopiedPayment] = useState(false);

    // Escape key dismiss & body overflow lock
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !restaurant) return null;

    const lang = isAm ? 'AM' : 'EN';
    const translations = restaurant.translations ?? [];
    const displayDesc = getTranslation(translations, lang, 'description') || restaurant.description || '';
    const displayAddress = getTranslation(translations, lang, 'address') || restaurant.address || '';
    const displayCity = getTranslation(translations, lang, 'city') || restaurant.city || '';

    const hasInfo = Boolean(displayDesc || restaurant.phone || restaurant.email || displayAddress || displayCity || restaurant.country);
    const hasPayment = Boolean(restaurant.paymentInfo && restaurant.paymentInfo.trim());
    const hasWifi = Boolean(restaurant.wifiName || restaurant.wifiPassword);

    const socialList: SocialMediaEntry[] = Array.isArray(restaurant.socialMedia)
        ? (restaurant.socialMedia as SocialMediaEntry[]).filter(s => s && s.url && s.url.trim() !== '')
        : [];

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

    const getSocialIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('facebook')) return <Facebook className="w-4 h-4 text-[#1877F2]" />;
        if (p.includes('instagram')) return <Instagram className="w-4 h-4 text-[#E4405F]" />;
        if (p.includes('youtube')) return <Youtube className="w-4 h-4 text-[#FF0000]" />;
        if (p.includes('linkedin')) return <Linkedin className="w-4 h-4 text-[#0A66C2]" />;
        if (p.includes('twitter') || p.includes('x')) return <Twitter className="w-4 h-4 text-[#1DA1F2]" />;
        if (p.includes('telegram')) return <Send className="w-4 h-4 text-[#229ED9]" />;
        if (p.includes('whatsapp')) return <MessageCircle className="w-4 h-4 text-[#25D366]" />;
        if (p.includes('tiktok')) return <Globe className="w-4 h-4 text-[#000000] dark:text-[#F5F5F5]" />;
        return <Link2 className="w-4 h-4 text-[color:var(--color-brand-500)]" />;
    };

    const resolveSocialHref = (platform: string, url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return '#';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        const p = platform.toLowerCase();
        if (p.includes('telegram')) {
            return `https://t.me/${trimmed.replace(/^@/, '')}`;
        }
        if (p.includes('instagram')) {
            return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
        }
        if (p.includes('tiktok')) {
            return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`;
        }
        if (p.includes('whatsapp')) {
            const digits = trimmed.replace(/\D/g, '');
            if (digits.startsWith('09')) return `https://wa.me/251${digits.slice(1)}`;
            return `https://wa.me/${digits}`;
        }
        if (p.includes('facebook')) {
            return `https://facebook.com/${trimmed.replace(/^@/, '')}`;
        }
        if (p.includes('youtube')) {
            return `https://youtube.com/@${trimmed.replace(/^@/, '')}`;
        }
        if (p.includes('twitter') || p.includes('x')) {
            return `https://x.com/${trimmed.replace(/^@/, '')}`;
        }
        return `https://${trimmed}`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-action-title"
        >
            <div
                className={cn(
                    "w-full sm:max-w-lg bg-white dark:bg-[#141414] text-neutral-900 dark:text-[#F5F5F5] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-[#2A2A2A] flex flex-col max-h-[88vh] sm:max-h-[82vh] overflow-hidden animate-slide-up sm:animate-scale-up",
                    isAm && "font-ethiopic"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Mobile Drag Indicator ── */}
                <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center shrink-0">
                    <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {/* ── Header with Tab Switching & Close Button ── */}
                <div className="relative px-4 sm:px-6 pt-3 sm:pt-4 pb-3 border-b border-neutral-100 dark:border-[#222222] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('public.close', { defaultValue: 'Close' })}
                        className="absolute right-3 top-3 sm:right-4 sm:top-4 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] hover:text-neutral-900 dark:hover:text-[#F5F5F5] hover:bg-neutral-200 dark:hover:bg-[#2E2E2E] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Available Action Tabs */}
                    <div className="flex items-center gap-1.5 pr-10 overflow-x-auto hide-scrollbar">
                        {hasInfo && (
                            <button
                                type="button"
                                onClick={() => onChangeAction?.('info')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                                    activeAction === 'info'
                                        ? "bg-[color:var(--color-brand-500)] text-white shadow-xs"
                                        : "bg-neutral-100 dark:bg-[#222222] text-neutral-600 dark:text-[#A3A3A3] hover:bg-neutral-200 dark:hover:bg-[#2A2A2A]"
                                )}
                            >
                                <Info className="w-3.5 h-3.5" />
                                <span>{t('public.quick_info', { defaultValue: 'Info' })}</span>
                            </button>
                        )}

                        {hasPayment && (
                            <button
                                type="button"
                                onClick={() => onChangeAction?.('payment')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                                    activeAction === 'payment'
                                        ? "bg-[color:var(--color-brand-500)] text-white shadow-xs"
                                        : "bg-neutral-100 dark:bg-[#222222] text-neutral-600 dark:text-[#A3A3A3] hover:bg-neutral-200 dark:hover:bg-[#2A2A2A]"
                                )}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{t('public.quick_payment', { defaultValue: 'Payment' })}</span>
                            </button>
                        )}

                        {hasWifi && (
                            <button
                                type="button"
                                onClick={() => onChangeAction?.('wifi')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none",
                                    activeAction === 'wifi'
                                        ? "bg-[color:var(--color-brand-500)] text-white shadow-xs"
                                        : "bg-neutral-100 dark:bg-[#222222] text-neutral-600 dark:text-[#A3A3A3] hover:bg-neutral-200 dark:hover:bg-[#2A2A2A]"
                                )}
                            >
                                <Wifi className="w-3.5 h-3.5" />
                                <span>{t('public.quick_wifi', { defaultValue: 'Wi-Fi' })}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 text-[13px] sm:text-[14px]">
                    {/* ── INFO TAB ── */}
                    {activeAction === 'info' && (
                        <div className="space-y-4">
                            {/* 1. Description */}
                            {displayDesc && (
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626]">
                                    <p className="text-neutral-700 dark:text-[#D4D4D4] leading-relaxed text-xs sm:text-[13.5px] whitespace-pre-line break-words">
                                        {displayDesc}
                                    </p>
                                </div>
                            )}

                            {/* 2. Contact & Location */}
                            {(restaurant.phone || restaurant.email || displayAddress || displayCity || restaurant.country) && (
                                <div className="space-y-2">
                                    <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                        <span>{t('public.contact', { defaultValue: 'Contact & Location' })}</span>
                                    </h3>

                                    <div className="p-3 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-2.5">
                                        {restaurant.phone && (
                                            <a
                                                href={`tel:${restaurant.phone}`}
                                                onClick={() => onCallClick?.()}
                                                className="flex items-center gap-2.5 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                            >
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                                <span className="font-semibold text-xs sm:text-sm break-all">{restaurant.phone}</span>
                                            </a>
                                        )}

                                        {restaurant.email && (
                                            <a
                                                href={`mailto:${restaurant.email}`}
                                                className="flex items-center gap-2.5 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                            >
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                                <span className="truncate text-xs sm:text-sm break-all">{restaurant.email}</span>
                                            </a>
                                        )}

                                        {(displayAddress || displayCity || restaurant.country) && (
                                            <div
                                                onClick={() => onDirectionsClick?.()}
                                                className="flex items-start gap-2.5 text-neutral-700 dark:text-[#D4D4D4] cursor-pointer"
                                            >
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 mt-0.5">
                                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </div>
                                                <div className="leading-snug flex-1 min-w-0">
                                                    {displayAddress && <p className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-[#F5F5F5] break-words">{displayAddress}</p>}
                                                    <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#999999] break-words">
                                                        {[displayCity, restaurant.country === 'Ethiopia' && isAm ? 'ኢትዮጵያ' : restaurant.country].filter(Boolean).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 3. Social Media Links */}
                            {socialList.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                        <Share2 className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                        <span>{t('public.social_media', { defaultValue: 'Connect With Us' })}</span>
                                    </h3>

                                    <div className="grid grid-cols-2 gap-2">
                                        {socialList.map((item, idx) => (
                                            <a
                                                key={idx}
                                                href={resolveSocialHref(item.platform, item.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => onSocialClick?.(item.platform)}
                                                className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] hover:border-[color:var(--color-brand-500)] hover:bg-white dark:hover:bg-[#222222] transition-all group min-h-[40px]"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-white dark:bg-[#262626] border border-neutral-200/60 dark:border-[#333333] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                    {getSocialIcon(item.platform)}
                                                </div>
                                                <span className="text-[11.5px] sm:text-xs font-semibold truncate text-neutral-800 dark:text-[#E5E5E5] group-hover:text-[color:var(--color-brand-500)]">
                                                    {item.platform}
                                                </span>
                                                <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!displayDesc && !restaurant.phone && !restaurant.email && !displayAddress && socialList.length === 0 && (
                                <p className="text-xs text-neutral-400 dark:text-[#888888] italic text-center py-4">
                                    {t('public.no_info', { defaultValue: 'No information provided.' })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── PAYMENT TAB ── */}
                    {activeAction === 'payment' && (
                        <div className="space-y-3">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.payment_methods', { defaultValue: 'Payment Methods' })}</span>
                            </h3>

                            {restaurant.paymentInfo ? (
                                <div className="space-y-3">
                                    <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] text-xs sm:text-[13.5px] text-neutral-800 dark:text-[#E5E5E5] font-mono whitespace-pre-line leading-relaxed break-words select-text">
                                        {restaurant.paymentInfo}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleCopyPaymentInfo}
                                            className="min-h-[40px] px-4 py-2 flex items-center gap-1.5 rounded-xl bg-[color:var(--color-brand-500)] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer"
                                            aria-label={t('public.copy_all', { defaultValue: 'Copy Details' })}
                                        >
                                            {copiedPayment ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            <span>{copiedPayment ? t('public.copied') : t('public.copy_all', { defaultValue: 'Copy Details' })}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400 dark:text-[#888888] italic text-center py-4">
                                    {t('public.no_payment_info', { defaultValue: 'No payment methods configured.' })}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── WI-FI TAB ── */}
                    {activeAction === 'wifi' && (
                        <div className="space-y-3">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <Wifi className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.wifi', { defaultValue: 'Guest Wi-Fi' })}</span>
                            </h3>

                            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-3">
                                {restaurant.wifiName && (
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs text-neutral-500 dark:text-[#999999] font-medium shrink-0">
                                            {t('public.wifi_network', { defaultValue: 'Wi-Fi Network' })}:
                                        </span>
                                        <span className="font-mono font-bold text-xs sm:text-[13.5px] text-neutral-900 dark:text-[#F5F5F5] break-all select-text">
                                            {restaurant.wifiName}
                                        </span>
                                    </div>
                                )}

                                {restaurant.wifiPassword && (
                                    <div className={cn(
                                        "flex items-center justify-between gap-2 flex-wrap pt-2.5",
                                        restaurant.wifiName && "border-t border-neutral-200/50 dark:border-[#262626]"
                                    )}>
                                        <span className="text-xs text-neutral-500 dark:text-[#999999] font-medium shrink-0">
                                            {t('public.wifi_password', { defaultValue: 'Wi-Fi Password' })}:
                                        </span>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-mono font-bold text-xs sm:text-[13px] text-neutral-900 dark:text-[#F5F5F5] bg-white dark:bg-[#222222] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-[#333333] select-text truncate max-w-[130px] sm:max-w-[190px]">
                                                {showWifiPassword ? restaurant.wifiPassword : '••••••••'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowWifiPassword(!showWifiPassword)}
                                                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white dark:bg-[#222222] text-neutral-500 hover:text-neutral-800 dark:hover:text-[#F5F5F5] border border-neutral-200 dark:border-[#333333] transition-colors cursor-pointer shrink-0"
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
                                    <p className="text-xs text-neutral-400 dark:text-[#888888] italic text-center py-2">
                                        {t('public.no_wifi_info', { defaultValue: 'No Wi-Fi credentials configured.' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer Close Button ── */}
                <div className="p-3.5 sm:p-4 border-t border-neutral-100 dark:border-[#222222] bg-neutral-50/60 dark:bg-[#161616]/60 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full h-10 sm:h-11 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs sm:text-sm hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                    >
                        {t('public.close', { defaultValue: 'Close' })}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Also export alias QuickActionPanel pointing to QuickActionModal for full backwards compatibility
export const QuickActionPanel = QuickActionModal;
