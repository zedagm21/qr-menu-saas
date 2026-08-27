import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Phone, Mail, MapPin, Globe, Wifi, CreditCard,
    Share2, Copy, Check, Eye, EyeOff, ExternalLink,
    Facebook, Instagram, Youtube, Linkedin, Twitter,
    MessageCircle, Send, Link2, Store
} from 'lucide-react';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant, SocialMediaEntry } from '../../types';
import toast from 'react-hot-toast';

interface RestaurantInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    isAm?: boolean;
    onSocialClick?: (platform: string) => void;
    onCallClick?: () => void;
    onDirectionsClick?: () => void;
}

export const RestaurantInfoModal: React.FC<RestaurantInfoModalProps> = ({
    isOpen,
    onClose,
    restaurant,
    isAm = false,
    onSocialClick,
    onCallClick,
    onDirectionsClick,
}) => {
    const { t } = useTranslation();
    const [showWifiPassword, setShowWifiPassword] = useState(false);
    const [copiedWifi, setCopiedWifi] = useState(false);

    // Escape key dismiss
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

    const displayName = getTranslation(translations, lang, 'name') || restaurant.name || '';
    const displayDesc = getTranslation(translations, lang, 'description') || restaurant.description || '';
    const displayAddress = getTranslation(translations, lang, 'address') || restaurant.address || '';
    const displayCity = getTranslation(translations, lang, 'city') || restaurant.city || '';

    const hasContact = Boolean(restaurant.phone || restaurant.email || displayAddress || displayCity || restaurant.country);
    const hasWifi = Boolean(restaurant.wifiName || restaurant.wifiPassword);
    const hasPayment = Boolean(restaurant.paymentInfo && restaurant.paymentInfo.trim());

    const socialList: SocialMediaEntry[] = Array.isArray(restaurant.socialMedia)
        ? (restaurant.socialMedia as SocialMediaEntry[]).filter(s => s && s.url && s.url.trim() !== '')
        : [];

    const handleCopyPassword = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!restaurant.wifiPassword) return;
        navigator.clipboard.writeText(restaurant.wifiPassword);
        setCopiedWifi(true);
        toast.success(t('public.copied', { defaultValue: 'Copied to clipboard!' }), { id: 'wifi-copied' });
        setTimeout(() => setCopiedWifi(false), 2500);
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-info-title"
        >
            <div
                className={cn(
                    "w-full sm:max-w-lg bg-white dark:bg-[#141414] text-neutral-900 dark:text-[#F5F5F5] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-[#2A2A2A] flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-scale-up",
                    isAm && "font-ethiopic"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Mobile Drag Indicator ── */}
                <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
                    <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {/* ── Header with Close Button ── */}
                <div className="relative px-4 sm:px-6 pt-2.5 sm:pt-4 pb-2.5 sm:pb-3.5 border-b border-neutral-100 dark:border-[#222222] shrink-0">
                    <button
                        onClick={onClose}
                        aria-label={t('public.close', { defaultValue: 'Close' })}
                        className="absolute right-2.5 top-2 sm:right-3.5 sm:top-3.5 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] hover:text-neutral-900 dark:hover:text-[#F5F5F5] hover:bg-neutral-200 dark:hover:bg-[#2E2E2E] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Logo + Name + Subtitle */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 aspect-square rounded-full border-2 border-[color:var(--color-brand-500)]/30 p-0.5 sm:p-1 mb-1.5 sm:mb-2 shadow-xs bg-white dark:bg-[#1E1E1E] overflow-hidden flex items-center justify-center">
                            {restaurant.logoUrl ? (
                                <img
                                    src={restaurant.logoUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover rounded-full aspect-square block"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-[color:var(--color-brand-500)] to-[color:var(--color-accent-500)] flex items-center justify-center text-white text-lg sm:text-xl font-black aspect-square">
                                    {displayName.charAt(0).toUpperCase() || <Store className="w-6 h-6 sm:w-7 sm:h-7" />}
                                </div>
                            )}
                        </div>

                        <h2 id="restaurant-info-title" className="text-base sm:text-xl font-extrabold text-neutral-900 dark:text-[#F5F5F5] tracking-tight break-words px-8 leading-snug">
                            {displayName}
                        </h2>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-[color:var(--color-brand-500)] tracking-widest uppercase mt-0.5">
                            {t('public.about_restaurant', { defaultValue: 'About Restaurant' })}
                        </p>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4.5 text-[13px] sm:text-[14px]">
                    {/* 1. Description */}
                    {displayDesc && (
                        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626]">
                            <p className="text-neutral-700 dark:text-[#D4D4D4] leading-relaxed text-[12.5px] sm:text-[13.5px] whitespace-pre-line break-words">
                                {displayDesc}
                            </p>
                        </div>
                    )}

                    {/* 2. Contact Details */}
                    {hasContact && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.contact', { defaultValue: 'Contact & Location' })}</span>
                            </h3>

                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-2.5 sm:space-y-3">
                                {restaurant.phone && (
                                    <a
                                        href={`tel:${restaurant.phone}`}
                                        onClick={() => onCallClick?.()}
                                        className="flex items-center gap-2.5 sm:gap-3 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="font-semibold text-xs sm:text-sm break-all">{restaurant.phone}</span>
                                    </a>
                                )}

                                {restaurant.email && (
                                    <a
                                        href={`mailto:${restaurant.email}`}
                                        className="flex items-center gap-2.5 sm:gap-3 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                        <span className="truncate text-xs sm:text-sm break-all">{restaurant.email}</span>
                                    </a>
                                )}

                                {(displayAddress || displayCity || restaurant.country) && (
                                    <div
                                        onClick={() => onDirectionsClick?.()}
                                        className="flex items-start gap-2.5 sm:gap-3 text-neutral-700 dark:text-[#D4D4D4] cursor-pointer"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 mt-0.5">
                                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </div>
                                        <div className="leading-snug flex-1 min-w-0">
                                            {displayAddress && <p className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-[#F5F5F5] break-words">{displayAddress}</p>}
                                            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#999999] break-words">
                                                {[displayCity, restaurant.country].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. WiFi Details */}
                    {hasWifi && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <Wifi className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.wifi', { defaultValue: 'Guest WiFi' })}</span>
                            </h3>

                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-2 sm:space-y-2.5">
                                {restaurant.wifiName && (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#999999] font-medium shrink-0">
                                            {t('public.wifi_name_label', { defaultValue: 'WiFi Name' })}:
                                        </span>
                                        <span className="font-bold text-neutral-900 dark:text-[#F5F5F5] font-mono text-xs sm:text-[13px] truncate text-right">
                                            {restaurant.wifiName}
                                        </span>
                                    </div>
                                )}

                                {restaurant.wifiPassword && (
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/50 dark:border-[#262626]">
                                        <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-[#999999] font-medium shrink-0">
                                            {t('public.wifi_password_label', { defaultValue: 'Password' })}:
                                        </span>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="font-mono font-bold text-neutral-900 dark:text-[#F5F5F5] text-xs sm:text-[13px] bg-white dark:bg-[#222222] px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-[#333333] truncate max-w-[110px] sm:max-w-[170px]">
                                                {showWifiPassword ? restaurant.wifiPassword : '••••••••'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowWifiPassword(!showWifiPassword)}
                                                className="min-w-[38px] min-h-[38px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg bg-white dark:bg-[#222222] text-neutral-500 hover:text-neutral-800 dark:hover:text-[#F5F5F5] border border-neutral-200 dark:border-[#333333] transition-colors cursor-pointer shrink-0"
                                                aria-label={showWifiPassword ? t('restaurant.hide_password') : t('restaurant.show_password')}
                                            >
                                                {showWifiPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCopyPassword}
                                                className="min-h-[38px] sm:min-h-[36px] px-2.5 sm:px-3 flex items-center gap-1 sm:gap-1.5 rounded-lg bg-[color:var(--color-brand-500)] text-white text-xs font-bold hover:brightness-110 transition-all shadow-xs cursor-pointer shrink-0"
                                                aria-label={t('public.copy_password', { defaultValue: 'Copy Password' })}
                                            >
                                                {copiedWifi ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                                <span className="text-[11px] sm:text-[12px]">{copiedWifi ? t('public.copied') : t('public.copy')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. Payment Information */}
                    {hasPayment && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.payment_info', { defaultValue: 'Payment Methods' })}</span>
                            </h3>

                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] text-xs sm:text-sm text-neutral-700 dark:text-[#D4D4D4] whitespace-pre-line leading-relaxed font-mono">
                                {restaurant.paymentInfo}
                            </div>
                        </div>
                    )}

                    {/* 5. Social Media Links */}
                    {socialList.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.social_media', { defaultValue: 'Connect With Us' })}</span>
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                                {socialList.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => onSocialClick?.(item.platform)}
                                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] hover:border-[color:var(--color-brand-500)] hover:bg-white dark:hover:bg-[#222222] transition-all group min-h-[42px]"
                                    >
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white dark:bg-[#262626] border border-neutral-200/60 dark:border-[#333333] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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
                </div>

                {/* ── Footer Close Button ── */}
                <div className="p-3.5 sm:p-4 border-t border-neutral-100 dark:border-[#222222] bg-neutral-50/60 dark:bg-[#161616]/60 shrink-0">
                    <button
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
