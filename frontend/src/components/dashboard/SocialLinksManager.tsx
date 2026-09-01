import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Share2, Plus, Trash2, ExternalLink, Link2,
    Instagram, Facebook, Youtube, Linkedin, Twitter,
    Send, MessageCircle, Globe, Sparkles, Save, Check,
    ChevronUp, X
} from 'lucide-react';
import type { SocialMediaEntry } from '../../types';
import { cn } from '../../lib/utils';
import { useUpdateRestaurant } from '../../hooks/useRestaurant';
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
    const { mutateAsync: updateRestaurant, isPending } = useUpdateRestaurant();
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const getPlatformConfig = (platformName: string): SocialPlatformConfig => {
        const found = PLATFORMS.find(p => p.id.toLowerCase() === platformName.toLowerCase());
        return found || PLATFORMS[PLATFORMS.length - 1]; // default to Website
    };

    // When activePlatform changes, populate inputValue with existing link if any
    useEffect(() => {
        if (activePlatform) {
            const existing = links.find(l => l.platform.toLowerCase() === activePlatform.toLowerCase());
            setInputValue(existing?.url || '');
            setTimeout(() => inputRef.current?.focus(), 80);
        } else {
            setInputValue('');
        }
    }, [activePlatform, links]);

    const handlePlatformClick = (platformId: string) => {
        if (activePlatform === platformId) {
            setActivePlatform(null);
        } else {
            setActivePlatform(platformId);
        }
    };

    const handleSaveCurrent = async () => {
        if (!activePlatform) return;
        const config = getPlatformConfig(activePlatform);
        const trimmed = inputValue.trim();

        if (!trimmed) {
            toast.error(t('restaurant.enter_url_first', { defaultValue: 'Please enter a username or link first.' }));
            return;
        }

        const normalizedUrl = config.normalizeUrl(trimmed);

        // Update links list: update existing or append
        let updatedLinks = [...links];
        const existingIdx = updatedLinks.findIndex(l => l.platform.toLowerCase() === activePlatform.toLowerCase());
        if (existingIdx >= 0) {
            updatedLinks[existingIdx] = { platform: activePlatform, url: normalizedUrl };
        } else {
            updatedLinks.push({ platform: activePlatform, url: normalizedUrl });
        }

        // Clean any invalid / empty
        const cleanLinks = updatedLinks.filter(l => l.url.trim() !== '');

        try {
            await updateRestaurant({ socialMedia: cleanLinks });
            onChange(cleanLinks);
            toast.success(t('toast.saved', { defaultValue: 'Social link saved!' }), { id: `social-${activePlatform}` });
            // Collapse the add/edit interface after saving
            setActivePlatform(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || t('toast.error', { defaultValue: 'Failed to save social link' }));
        }
    };

    const handleRemoveCurrent = async (platformId: string) => {
        const cleanLinks = links.filter(l => l.platform.toLowerCase() !== platformId.toLowerCase());
        try {
            await updateRestaurant({ socialMedia: cleanLinks });
            onChange(cleanLinks);
            toast.success(t('toast.saved', { defaultValue: 'Link removed' }));
            setActivePlatform(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || t('toast.error'));
        }
    };

    const handleTestLink = () => {
        if (!activePlatform || !inputValue.trim()) return;
        const config = getPlatformConfig(activePlatform);
        const resolved = config.normalizeUrl(inputValue);
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
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {links.length}
                            </span>
                        )}
                    </div>
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('restaurant.social_media_desc', { defaultValue: 'Connect your social channels to display clickable links to guests.' })}
                    </p>
                </div>
            </div>

            {/* ── Social Media Icon List (Top Bar) ── */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <Sparkles className="w-3 h-3 text-[color:var(--color-brand-500)]" />
                    <span>{t('restaurant.quick_add', { defaultValue: 'Social Platforms' })}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                        const existing = links.find(l => l.platform.toLowerCase() === platform.id.toLowerCase() && l.url.trim() !== '');
                        const isConfigured = Boolean(existing);
                        const isSelected = activePlatform?.toLowerCase() === platform.id.toLowerCase();

                        return (
                            <button
                                key={platform.id}
                                type="button"
                                onClick={() => handlePlatformClick(platform.id)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.97] select-none",
                                    isConfigured
                                        ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700"
                                        : isSelected
                                            ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-400 dark:border-neutral-500 text-neutral-900 dark:text-white ring-2 ring-blue-500/30"
                                            : "bg-white dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-500/10"
                                )}
                            >
                                <span className={cn("shrink-0", isConfigured && "brightness-0 invert")}>
                                    {platform.icon}
                                </span>
                                <span>{platform.name}</span>
                                {isConfigured ? (
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                ) : isSelected ? (
                                    <ChevronUp className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                ) : (
                                    <Plus className="w-3 h-3 opacity-50" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Collapsible Add / Edit Interface ── */}
            {activePlatform && (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/90 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-sm space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                                {getPlatformConfig(activePlatform).icon}
                            </div>
                            <span className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
                                {getPlatformConfig(activePlatform).name}
                            </span>
                            {links.some(l => l.platform.toLowerCase() === activePlatform.toLowerCase() && l.url.trim() !== '') && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    Connected
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setActivePlatform(null)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* URL input */}
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveCurrent();
                                    }
                                }}
                                placeholder={getPlatformConfig(activePlatform).placeholder}
                                className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[13.5px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono text-[13px]"
                            />
                        </div>

                        {/* Action buttons: Save, Test, Remove */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleSaveCurrent}
                                disabled={isPending || !inputValue.trim()}
                                className={cn(
                                    "h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                                    inputValue.trim()
                                        ? "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white"
                                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
                                )}
                            >
                                {isPending ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{t('actions.save', { defaultValue: 'Save' })}</span>
                            </button>

                            {Boolean(inputValue.trim()) && (
                                <button
                                    type="button"
                                    onClick={handleTestLink}
                                    title={t('restaurant.test_link', { defaultValue: 'Test link in new tab' })}
                                    className="h-11 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="hidden xs:inline">{t('restaurant.test_link', { defaultValue: 'Test' })}</span>
                                </button>
                            )}

                            {links.some(l => l.platform.toLowerCase() === activePlatform.toLowerCase()) && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCurrent(activePlatform)}
                                    title={t('restaurant.remove_social', { defaultValue: 'Remove link' })}
                                    className="h-11 w-11 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
