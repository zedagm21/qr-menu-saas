import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Phone, Mail, MapPin, Store } from 'lucide-react';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant } from '../../types';

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
    onCallClick,
    onDirectionsClick,
}) => {
    const { t } = useTranslation();

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
                        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-[#262626]">
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
