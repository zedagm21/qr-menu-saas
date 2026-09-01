import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, ExternalLink, Share2, Facebook, Instagram,
    Youtube, Linkedin, Twitter, MessageCircle, Send,
    Globe, Link2, Store
} from 'lucide-react';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant, SocialMediaEntry } from '../../types';

interface SocialMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    isAm?: boolean;
    onSocialClick?: (platform: string) => void;
}

export const SocialMediaModal: React.FC<SocialMediaModalProps> = ({
    isOpen,
    onClose,
    restaurant,
    isAm = false,
    onSocialClick,
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

    const socialList: SocialMediaEntry[] = Array.isArray(restaurant.socialMedia)
        ? (restaurant.socialMedia as SocialMediaEntry[]).filter(s => s && s.url && s.url.trim() !== '')
        : [];

    const getSocialIcon = (platform: string) => {
        const p = platform.toLowerCase();
        if (p.includes('facebook')) return <Facebook className="w-5 h-5 text-[#1877F2]" />;
        if (p.includes('instagram')) return <Instagram className="w-5 h-5 text-[#E4405F]" />;
        if (p.includes('youtube')) return <Youtube className="w-5 h-5 text-[#FF0000]" />;
        if (p.includes('linkedin')) return <Linkedin className="w-5 h-5 text-[#0A66C2]" />;
        if (p.includes('twitter') || p.includes('x')) return <Twitter className="w-5 h-5 text-[#1DA1F2]" />;
        if (p.includes('telegram')) return <Send className="w-5 h-5 text-[#229ED9]" />;
        if (p.includes('whatsapp')) return <MessageCircle className="w-5 h-5 text-[#25D366]" />;
        if (p.includes('tiktok')) return <Globe className="w-5 h-5 text-neutral-900 dark:text-[#F5F5F5]" />;
        return <Link2 className="w-5 h-5 text-[color:var(--color-brand-500)]" />;
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
            aria-labelledby="social-modal-title"
        >
            <div
                className={cn(
                    "w-full sm:max-w-md bg-white dark:bg-[#141414] text-neutral-900 dark:text-[#F5F5F5] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-[#2A2A2A] flex flex-col max-h-[85vh] overflow-hidden animate-slide-up sm:animate-scale-up",
                    isAm && "font-ethiopic"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Drag Indicator */}
                <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
                    <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {/* Header */}
                <div className="relative px-5 pt-3 pb-3 border-b border-neutral-100 dark:border-[#222222] shrink-0">
                    <button
                        onClick={onClose}
                        aria-label={t('public.close', { defaultValue: 'Close' })}
                        className="absolute right-3.5 top-3.5 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] hover:text-neutral-900 dark:hover:text-[#F5F5F5] hover:bg-neutral-200 dark:hover:bg-[#2E2E2E] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 id="social-modal-title" className="text-base font-extrabold text-neutral-900 dark:text-[#F5F5F5] truncate">
                                {t('public.social_media', { defaultValue: 'Connect With Us' })}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-[#A3A3A3] truncate">
                                {displayName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Social Links Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {socialList.length === 0 ? (
                        <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-xs">
                            {t('restaurant.no_social_added', { defaultValue: 'No social media accounts linked yet.' })}
                        </div>
                    ) : (
                        socialList.map((item, idx) => (
                            <a
                                key={idx}
                                href={resolveSocialHref(item.platform, item.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => onSocialClick?.(item.platform)}
                                className="flex items-center gap-3.5 p-3 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/70 dark:border-[#262626] hover:border-[color:var(--color-brand-500)] hover:bg-white dark:hover:bg-[#222222] transition-all group active:scale-[0.99]"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#262626] border border-neutral-200/70 dark:border-[#333333] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                    {getSocialIcon(item.platform)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[13.5px] font-bold text-neutral-900 dark:text-[#F5F5F5] block truncate group-hover:text-[color:var(--color-brand-500)] transition-colors">
                                        {item.platform}
                                    </span>
                                    <span className="text-[11.5px] text-neutral-500 dark:text-[#A3A3A3] font-mono block truncate">
                                        {item.url.replace(/^https?:\/\/(www\.)?/, '')}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#282828] text-neutral-400 group-hover:text-[color:var(--color-brand-500)] group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 flex items-center justify-center transition-all shrink-0">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </a>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3.5 border-t border-neutral-100 dark:border-[#222222] bg-neutral-50/60 dark:bg-[#161616]/60 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                    >
                        {t('public.close', { defaultValue: 'Close' })}
                    </button>
                </div>
            </div>
        </div>
    );
};
