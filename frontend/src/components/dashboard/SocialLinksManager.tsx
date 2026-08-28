import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Share2, Plus, Trash2, ExternalLink, Link2,
    Instagram, Facebook, Youtube, Linkedin, Twitter,
    Send, MessageCircle, Globe, Sparkles
} from 'lucide-react';
import type { SocialMediaEntry } from '../../types';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export interface SocialPlatformConfig {
    id: string;
    name: string;
    placeholder: string;
    prefix: string;
    brandColor: string;
    icon: React.ReactNode;
    normalizeUrl: (input: string) => string;
}

export const PLATFORMS: SocialPlatformConfig[] = [
    {
        id: 'Instagram',
        name: 'Instagram',
        placeholder: '@restaurant or instagram.com/name',
        prefix: 'instagram.com/',
        brandColor: '#E4405F',
        icon: <Instagram className="w-4 h-4 text-[#E4405F]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('@')) return `https://instagram.com/${trimmed.slice(1)}`;
            if (trimmed.startsWith('instagram.com/')) return `https://${trimmed}`;
            return `https://instagram.com/${trimmed}`;
        },
    },
    {
        id: 'Telegram',
        name: 'Telegram',
        placeholder: '@channel or t.me/channel',
        prefix: 't.me/',
        brandColor: '#229ED9',
        icon: <Send className="w-4 h-4 text-[#229ED9]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`;
            if (trimmed.startsWith('t.me/')) return `https://${trimmed}`;
            return `https://t.me/${trimmed}`;
        },
    },
    {
        id: 'TikTok',
        name: 'TikTok',
        placeholder: '@restaurant or tiktok.com/@name',
        prefix: 'tiktok.com/@',
        brandColor: '#000000',
        icon: <Globe className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('@')) return `https://tiktok.com/${trimmed}`;
            if (trimmed.startsWith('tiktok.com/')) return `https://${trimmed}`;
            return `https://tiktok.com/@${trimmed}`;
        },
    },
    {
        id: 'WhatsApp',
        name: 'WhatsApp',
        placeholder: '+251911... or wa.me/251...',
        prefix: 'wa.me/',
        brandColor: '#25D366',
        icon: <MessageCircle className="w-4 h-4 text-[#25D366]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            const digits = trimmed.replace(/\D/g, '');
            if (digits.startsWith('09')) {
                return `https://wa.me/251${digits.slice(1)}`;
            }
            if (digits) {
                return `https://wa.me/${digits}`;
            }
            return `https://${trimmed}`;
        },
    },
    {
        id: 'Facebook',
        name: 'Facebook',
        placeholder: 'facebook.com/restaurant',
        prefix: 'facebook.com/',
        brandColor: '#1877F2',
        icon: <Facebook className="w-4 h-4 text-[#1877F2]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('facebook.com/')) return `https://${trimmed}`;
            return `https://facebook.com/${trimmed.replace(/^@/, '')}`;
        },
    },
    {
        id: 'YouTube',
        name: 'YouTube',
        placeholder: 'youtube.com/@channel',
        prefix: 'youtube.com/@',
        brandColor: '#FF0000',
        icon: <Youtube className="w-4 h-4 text-[#FF0000]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('@')) return `https://youtube.com/${trimmed}`;
            if (trimmed.startsWith('youtube.com/')) return `https://${trimmed}`;
            return `https://youtube.com/@${trimmed}`;
        },
    },
    {
        id: 'Twitter/X',
        name: 'Twitter/X',
        placeholder: '@restaurant or x.com/name',
        prefix: 'x.com/',
        brandColor: '#1DA1F2',
        icon: <Twitter className="w-4 h-4 text-[#1DA1F2]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('@')) return `https://x.com/${trimmed.slice(1)}`;
            if (trimmed.startsWith('x.com/') || trimmed.startsWith('twitter.com/')) return `https://${trimmed}`;
            return `https://x.com/${trimmed}`;
        },
    },
    {
        id: 'LinkedIn',
        name: 'LinkedIn',
        placeholder: 'linkedin.com/company/name',
        prefix: 'linkedin.com/',
        brandColor: '#0A66C2',
        icon: <Linkedin className="w-4 h-4 text-[#0A66C2]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            if (trimmed.startsWith('linkedin.com/')) return `https://${trimmed}`;
            return `https://linkedin.com/in/${trimmed.replace(/^@/, '')}`;
        },
    },
    {
        id: 'Website',
        name: 'Website',
        placeholder: 'https://yourrestaurant.com',
        prefix: 'https://',
        brandColor: 'var(--color-brand-500)',
        icon: <Link2 className="w-4 h-4 text-[color:var(--color-brand-500)]" />,
        normalizeUrl: (input: string) => {
            const trimmed = input.trim();
            if (!trimmed) return '';
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://${trimmed}`;
        },
    },
];

interface SocialLinksManagerProps {
    links: SocialMediaEntry[];
    onChange: (updatedLinks: SocialMediaEntry[]) => void;
}

export const SocialLinksManager: React.FC<SocialLinksManagerProps> = ({
    links,
    onChange,
}) => {
    const { t } = useTranslation();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const getPlatformConfig = (platformName: string): SocialPlatformConfig => {
        const found = PLATFORMS.find(p => p.id.toLowerCase() === platformName.toLowerCase());
        return found || PLATFORMS[PLATFORMS.length - 1]; // default to Website
    };

    const handleAddPlatform = (platformId: string) => {
        const newLink: SocialMediaEntry = { platform: platformId, url: '' };
        const updated = [...links, newLink];
        onChange(updated);

        // Auto-focus new input after render
        setTimeout(() => {
            const lastIdx = updated.length - 1;
            inputRefs.current[lastIdx]?.focus();
        }, 80);
    };

    const handleRemove = (index: number) => {
        const updated = links.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handlePlatformChange = (index: number, newPlatform: string) => {
        const updated = links.map((item, i) => i === index ? { ...item, platform: newPlatform } : item);
        onChange(updated);
    };

    const handleUrlChange = (index: number, newUrl: string) => {
        const updated = links.map((item, i) => i === index ? { ...item, url: newUrl } : item);
        onChange(updated);
    };

    const handleTestLink = (item: SocialMediaEntry) => {
        if (!item.url.trim()) {
            toast.error(t('restaurant.enter_url_first', { defaultValue: 'Please enter a username or link first.' }));
            return;
        }
        const config = getPlatformConfig(item.platform);
        const resolved = config.normalizeUrl(item.url);
        window.open(resolved, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            {/* Header & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-[color:var(--color-brand-500)]" />
                        <span className="font-bold text-[14px] text-neutral-800 dark:text-neutral-200">
                            {t('restaurant.social_media', { defaultValue: 'Social Media Links' })}
                        </span>
                        {links.length > 0 && (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]">
                                {links.length}
                            </span>
                        )}
                    </div>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('restaurant.social_media_desc', { defaultValue: 'Connect your social channels to display clickable links to guests.' })}
                    </p>
                </div>
            </div>

            {/* ── Quick Add Platform Pills Bar ── */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <Sparkles className="w-3 h-3 text-[color:var(--color-brand-500)]" />
                    <span>{t('restaurant.quick_add', { defaultValue: 'Quick Add Platform' })}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                        const count = links.filter(l => l.platform.toLowerCase() === platform.id.toLowerCase()).length;
                        return (
                            <button
                                key={platform.id}
                                type="button"
                                onClick={() => handleAddPlatform(platform.id)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.97]",
                                    count > 0
                                        ? "bg-neutral-50 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-[color:var(--color-brand-500)] hover:text-[color:var(--color-brand-600)] dark:hover:text-[color:var(--color-brand-400)]"
                                        : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)]/40 dark:hover:bg-[color:var(--color-brand-500)]/10 hover:text-[color:var(--color-brand-600)] dark:hover:text-[color:var(--color-brand-400)]"
                                )}
                            >
                                <span className="shrink-0">{platform.icon}</span>
                                <span>{platform.name}</span>
                                {count > 0 ? (
                                    <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] flex items-center justify-center font-bold">
                                        {count}
                                    </span>
                                ) : (
                                    <Plus className="w-3 h-3 opacity-50" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Active Links List ── */}
            {links.length === 0 ? (
                /* Empty state */
                <div className="py-8 px-4 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/20 text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            {t('restaurant.no_social_added', { defaultValue: 'No social media accounts linked yet.' })}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                            {t('restaurant.no_social_added_desc', { defaultValue: 'Tap any platform above to quickly add your profile link.' })}
                        </p>
                    </div>
                </div>
            ) : (
                /* Dynamic items list */
                <div className="space-y-2.5">
                    {links.map((item, idx) => {
                        const config = getPlatformConfig(item.platform);
                        const hasValue = Boolean(item.url.trim());

                        return (
                            <div
                                key={idx}
                                className="group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200/90 dark:border-neutral-700/80 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-600 transition-all"
                            >
                                {/* Platform Selector with Brand Icon Badge */}
                                <div className="relative shrink-0 flex items-center">
                                    <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <div className="shrink-0 flex items-center justify-center">
                                            {config.icon}
                                        </div>
                                        <select
                                            value={item.platform}
                                            onChange={(e) => handlePlatformChange(idx, e.target.value)}
                                            className="bg-transparent text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer pr-1"
                                        >
                                            {PLATFORMS.map(p => (
                                                <option key={p.id} value={p.id} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* URL / Username Input */}
                                <div className="relative flex-1">
                                    <input
                                        ref={el => (inputRefs.current[idx] = el)}
                                        type="text"
                                        value={item.url}
                                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                                        placeholder={config.placeholder}
                                        className="w-full h-11 px-3.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-700/80 text-[13.5px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all font-mono text-[13px]"
                                    />
                                </div>

                                {/* Action Buttons: Test Link & Remove */}
                                <div className="flex items-center justify-end gap-1 shrink-0">
                                    {/* Test Link Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleTestLink(item)}
                                        disabled={!hasValue}
                                        title={hasValue ? t('restaurant.test_link', { defaultValue: 'Test link in new tab' }) : ''}
                                        className={cn(
                                            "min-w-[40px] h-11 px-2.5 rounded-xl flex items-center justify-center gap-1 text-xs font-semibold transition-colors cursor-pointer",
                                            hasValue
                                                ? "text-neutral-600 dark:text-neutral-300 hover:text-[color:var(--color-brand-600)] hover:bg-[color:var(--color-brand-50)] dark:hover:bg-[color:var(--color-brand-500)]/10"
                                                : "text-neutral-300 dark:text-neutral-600 opacity-40 cursor-not-allowed"
                                        )}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span className="hidden md:inline text-[11px] font-medium">{t('restaurant.test_link', { defaultValue: 'Test' })}</span>
                                    </button>

                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(idx)}
                                        className="min-w-[40px] h-11 px-2.5 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                        aria-label={t('restaurant.remove_social', { defaultValue: 'Remove link' })}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Bottom Add Link Button */}
                    <button
                        type="button"
                        onClick={() => handleAddPlatform('Instagram')}
                        className="w-full h-11 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)]/40 dark:hover:bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('restaurant.add_another_social', { defaultValue: 'Add Another Social Link' })}</span>
                    </button>
                </div>
            )}
        </div>
    );
};
