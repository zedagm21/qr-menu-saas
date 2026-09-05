import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Phone, Mail, MapPin, Store, CreditCard, Wifi,
    Copy, Check, Eye, EyeOff, Share2, Facebook, Instagram,
    Youtube, Linkedin, Twitter, MessageCircle, Send, Globe, Link2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant, SocialMediaEntry } from '../../types';

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
    const [copiedPayment, setCopiedPayment] = useState(false);

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
    const hasPayment = Boolean(restaurant.paymentInfo && restaurant.paymentInfo.trim());
    const hasWifi = Boolean(restaurant.wifiName || restaurant.wifiPassword);

    const socialList: SocialMediaEntry[] = Array.isArray(restaurant.socialMedia)
        ? (restaurant.socialMedia as SocialMediaEntry[]).filter(s => s && s.url && s.url.trim() !== '')
        : [];

    const handleCopyPayment = () => {
        if (!restaurant.paymentInfo) return;
        navigator.clipboard.writeText(restaurant.paymentInfo);
        setCopiedPayment(true);
        toast.success(t('public.copied', { defaultValue: 'Copied to clipboard!' }), { id: 'modal-payment-copied' });
        setTimeout(() => setCopiedPayment(false), 2500);
    };

    const handleCopyWifi = () => {
        if (!restaurant.wifiPassword) return;
        navigator.clipboard.writeText(restaurant.wifiPassword);
        setCopiedWifi(true);
        toast.success(t('public.copied', { defaultValue: 'Copied to clipboard!' }), { id: 'modal-wifi-copied' });
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
        if (p.includes('tiktok')) return <Globe className="w-4 h-4 text-neutral-900 dark:text-[#F5F5F5]" />;
        return <Link2 className="w-4 h-4 text-[color:var(--color-brand-500)]" />;
    };

    const resolveSocialHref = (platform: string, url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return '#';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        const p = platform.toLowerCase();
        if (p.includes('telegram')) return `https://t.me/${trimmed.replace(/^@/, '')}`;
        if (p.includes('instagram')) return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
        if (p.includes('tiktok')) return `https://tiktok.com/@${trimmed.replace(/^@/, '')}`;
        if (p.includes('whatsapp')) {
            const digits = trimmed.replace(/\D/g, '');
            if (digits.startsWith('09')) return `https://wa.me/251${digits.slice(1)}`;
            return `https://wa.me/${digits}`;
        }
        if (p.includes('facebook')) return `https://facebook.com/${trimmed.replace(/^@/, '')}`;
        if (p.includes('youtube')) return `https://youtube.com/@${trimmed.replace(/^@/, '')}`;
        if (p.includes('twitter') || p.includes('x')) return `https://x.com/${trimmed.replace(/^@/, '')}`;
        return `https://${trimmed}`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in"
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

                {/* ── Optional Hero Cover Banner ── */}
                {restaurant.coverImageUrl ? (
                    <div className="relative w-full h-32 sm:h-44 shrink-0 overflow-hidden bg-neutral-900">
                        <img
                            src={restaurant.coverImageUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
                        <button
                            onClick={onClose}
                            aria-label={t('public.close', { defaultValue: 'Close' })}
                            className="absolute right-3 top-3 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer border border-white/20 z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : null}

                {/* ── Header with Logo, Title, & Close Button ── */}
                <div className={cn(
                    "relative px-4 sm:px-6 pb-3 border-b border-neutral-100 dark:border-[#222222] shrink-0",
                    restaurant.coverImageUrl ? "pt-0 -mt-7 sm:-mt-8" : "pt-3.5 sm:pt-4"
                )}>
                    {!restaurant.coverImageUrl && (
                        <button
                            onClick={onClose}
                            aria-label={t('public.close', { defaultValue: 'Close' })}
                            className="absolute right-3.5 top-3.5 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] hover:text-neutral-900 dark:hover:text-[#F5F5F5] hover:bg-neutral-200 dark:hover:bg-[#2E2E2E] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Logo + Name + Subtitle */}
                    <div className="flex flex-col items-center text-center">
                        <div className={cn(
                            "relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 aspect-square rounded-full shadow-md overflow-hidden flex items-center justify-center",
                            restaurant.coverImageUrl
                                ? "ring-4 ring-white dark:ring-[#141414] bg-white dark:bg-[#1E1E1E] mb-1.5"
                                : "border-2 border-[color:var(--color-brand-500)]/30 p-0.5 mb-2 bg-white dark:bg-[#1E1E1E]"
                        )}>
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

                {/* ── Scrollable Body with All Venue Details ── */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-5 space-y-4 text-[13px] sm:text-[14px]">
                    {/* 1. Description */}
                    {displayDesc && (
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626]">
                            <p className="text-neutral-700 dark:text-[#D4D4D4] leading-relaxed text-[12.5px] sm:text-[13.5px] whitespace-pre-line break-words">
                                {displayDesc}
                            </p>
                        </div>
                    )}

                    {/* 2. Payments Section */}
                    {hasPayment && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{t('public.payment', { defaultValue: 'Payments' })}</span>
                            </h3>

                            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-2.5">
                                <p className="text-xs sm:text-[13px] font-mono text-neutral-800 dark:text-[#E5E5E5] whitespace-pre-line break-words leading-relaxed">
                                    {restaurant.paymentInfo}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCopyPayment}
                                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                >
                                    {copiedPayment ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedPayment ? t('public.copied', { defaultValue: 'Copied!' }) : t('public.copy', { defaultValue: 'Copy Payment Info' })}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. WiFi Section (Changed from Guest WiFi to WiFi) */}
                    {hasWifi && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <Wifi className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{t('public.wifi', { defaultValue: 'WiFi' })}</span>
                            </h3>

                            <div className="p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-3">
                                {restaurant.wifiName && (
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-500 block">
                                                {t('public.wifi_name_label', { defaultValue: 'Network Name' })}
                                            </span>
                                            <span className="text-sm font-bold text-neutral-900 dark:text-[#F5F5F5] font-mono">
                                                {restaurant.wifiName}
                                            </span>
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                            <Wifi className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}

                                {restaurant.wifiPassword && (
                                    <div className="space-y-2 pt-1 border-t border-black/5 dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-neutral-400 dark:text-neutral-500">
                                                {t('public.wifi_password_label', { defaultValue: 'Password' })}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowWifiPassword(!showWifiPassword)}
                                                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-[#F5F5F5] flex items-center gap-1 cursor-pointer transition-colors"
                                            >
                                                {showWifiPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                <span>{showWifiPassword ? t('restaurant.hide_password', { defaultValue: 'Hide' }) : t('restaurant.show_password', { defaultValue: 'Show' })}</span>
                                            </button>
                                        </div>

                                        <div className="p-2 rounded-xl bg-white dark:bg-[#202020] border border-neutral-200/80 dark:border-[#333333]">
                                            <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#F5F5F5] tracking-wider truncate block">
                                                {showWifiPassword ? restaurant.wifiPassword : '••••••••••••'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCopyWifi}
                                            className="w-full py-2 px-3 rounded-xl bg-[color:var(--color-brand-500)] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                                        >
                                            {copiedWifi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedWifi ? t('public.copied', { defaultValue: 'Copied!' }) : t('public.copy_password', { defaultValue: 'Copy Password' })}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. Social Media Links */}
                    {socialList.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.socials', { defaultValue: 'Social Media' })}</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                {socialList.map((social, idx) => {
                                    const href = resolveSocialHref(social.platform, social.url);
                                    return (
                                        <a
                                            key={`${social.platform}-${idx}`}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => onSocialClick?.(social.platform)}
                                            className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-[#222222] border border-neutral-200/60 dark:border-[#262626] flex items-center gap-2 transition-all group"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center shrink-0">
                                                {getSocialIcon(social.platform)}
                                            </div>
                                            <span className="text-xs font-bold text-neutral-800 dark:text-[#E5E5E5] group-hover:text-[color:var(--color-brand-500)] truncate capitalize">
                                                {social.platform}
                                            </span>
                                            <ExternalLink className="w-3 h-3 text-neutral-400 dark:text-neutral-600 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5. Contact & Location Details */}
                    {hasContact && (
                        <div className="space-y-2">
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-[#888888] flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[color:var(--color-brand-500)]" />
                                <span>{t('public.contact', { defaultValue: 'Contact & Location' })}</span>
                            </h3>

                            <div className="p-3 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626] space-y-2.5 sm:space-y-3">
                                {restaurant.phone && (
                                    <a
                                        href={`tel:${restaurant.phone}`}
                                        onClick={() => onCallClick?.()}
                                        className="flex items-center gap-2.5 sm:gap-3 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase block">{t('public.phone', { defaultValue: 'Phone' })}</span>
                                            <span className="font-semibold text-xs sm:text-sm break-all text-neutral-900 dark:text-[#F5F5F5]">{restaurant.phone}</span>
                                        </div>
                                    </a>
                                )}

                                {restaurant.email && (
                                    <a
                                        href={`mailto:${restaurant.email}`}
                                        className="flex items-center gap-2.5 sm:gap-3 text-neutral-800 dark:text-[#E5E5E5] hover:text-[color:var(--color-brand-500)] transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 group-hover:border-[color:var(--color-brand-500)]">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase block">{t('public.email', { defaultValue: 'Email' })}</span>
                                            <span className="truncate text-xs sm:text-sm break-all font-semibold text-neutral-900 dark:text-[#F5F5F5]">{restaurant.email}</span>
                                        </div>
                                    </a>
                                )}

                                {(displayAddress || displayCity || restaurant.country) && (
                                    <div
                                        onClick={() => onDirectionsClick?.()}
                                        className="flex items-start gap-2.5 sm:gap-3 text-neutral-700 dark:text-[#D4D4D4] cursor-pointer group"
                                    >
                                        <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-white dark:bg-[#242424] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center text-[color:var(--color-brand-500)] shrink-0 mt-0.5 group-hover:border-[color:var(--color-brand-500)]">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="leading-snug flex-1 min-w-0">
                                            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase block">{t('public.address', { defaultValue: 'Address' })}</span>
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
