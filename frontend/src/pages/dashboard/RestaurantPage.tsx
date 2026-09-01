import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Save, Globe, Eye, ImagePlus, UploadCloud,
    Building2, Store, CheckCircle2, Sparkles,
    Wifi, CreditCard, Share2, Plus, Trash2, EyeOff, Info,
    AlertTriangle
} from 'lucide-react';
import { useRestaurant, useUpdateRestaurant } from '../../hooks/useRestaurant';
import { restaurantApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { getTranslation, cn } from '../../lib/utils';
import type { SocialMediaEntry } from '../../types';
import { SocialLinksManager, PLATFORMS } from '../../components/dashboard/SocialLinksManager';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
    nameEn: string;
    descEn: string;
    addressEn: string;
    cityEn: string;
    nameAm: string;
    descAm: string;
    addressAm: string;
    cityAm: string;
    phone: string;
    email: string;
    country: string;
    defaultLanguage: 'EN' | 'AM';
    currency: string;
    status: 'DRAFT' | 'PUBLISHED';
    wifiName: string;
    wifiPassword: string;
    paymentInfo: string;
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────
const SectionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
    className?: string;
    gradient?: boolean;
    delay?: string;
}> = ({ icon, title, subtitle, children, className, gradient, delay }) => (
    <div
        className={cn(
            'animate-fade-in-up relative overflow-hidden rounded-[28px] border shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 lg:p-8 space-y-6',
            'backdrop-blur-sm bg-white/95 dark:bg-neutral-900/95 border-neutral-200/90 dark:border-neutral-800/90',
            gradient && 'lg:bg-gradient-to-br from-[color:var(--color-brand-50)]/40 via-white to-white dark:from-[color:var(--color-brand-500)]/5 dark:via-neutral-900/95 dark:to-neutral-900/95',
            className
        )}
        style={{ animationDelay: delay }}
    >
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[color:var(--color-brand-500)]/30 to-transparent" />
        {/* Decorative bg icon */}
        <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none">
            {icon}
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-accent-500)] flex items-center justify-center shadow-md shadow-[color:var(--color-brand-500)]/20 text-white shrink-0">
                    {icon}
                </div>
                <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{title}</h2>
            </div>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 ml-11">{subtitle}</p>
        </div>

        <div className="relative z-10">
            {children}
        </div>
    </div>
);

import { compressImage } from '../../lib/imageCompression';

// ─── Upload Zone ──────────────────────────────────────────────────────────────
interface UploadZoneProps {
    aspect: string;       // Tailwind aspect ratio class
    dragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imageUrl?: string;
    label: string;
    hint: string;
    emptyIcon: React.ReactNode;
    uploaded: boolean;
    progress?: number | null;
    tChangeImage: string;
    tDropToUpload: string;
    tToUpload: string;
    tClickDragDrop: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
    aspect, dragOver, onDragOver, onDragLeave, onDrop, onChange,
    imageUrl, label, hint, emptyIcon, uploaded, progress,
    tChangeImage, tDropToUpload, tToUpload, tClickDragDrop
}) => (
    <div className="flex flex-col">
        <div className="mb-3">
            <span className="block text-[13px] font-bold text-neutral-700 dark:text-neutral-300">{label}</span>
            <span className="text-[11px] text-neutral-400 font-medium">{hint}</span>
        </div>
        <label
            className={cn(
                'relative flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed cursor-pointer transition-all duration-300 group overflow-hidden',
                aspect,
                dragOver
                    ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)]/60 dark:bg-[color:var(--color-brand-500)]/10 shadow-sm'
                    : imageUrl
                        ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                        : 'bg-neutral-50/60 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-[color:var(--color-brand-400)] hover:bg-[color:var(--color-brand-50)]/40 dark:hover:bg-[color:var(--color-brand-500)]/10 hover:shadow-md hover:shadow-[color:var(--color-brand-500)]/10'
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={e => { e.preventDefault(); onDragLeave(); }}
        >
            {/* Progress overlay */}
            {progress !== null && progress !== undefined && (
                <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white animate-fade-in">
                    <div className="w-full max-w-[180px] bg-white/20 rounded-full h-2 overflow-hidden mb-2">
                        <div
                            className="bg-[color:var(--color-brand-400)] h-full rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[12px] font-bold tracking-wider">{progress < 100 ? `Uploading ${progress}%` : 'Processing...'}</span>
                </div>
            )}

            {imageUrl ? (
                <>
                    <img src={imageUrl} alt={label} className="absolute inset-0 w-full h-full object-cover rounded-[18px]" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-[18px] backdrop-blur-sm">
                        <UploadCloud className="w-6 h-6 text-white mb-1.5" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">{tChangeImage}</span>
                    </div>
                    {/* Success checkmark */}
                    {uploaded && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
                            <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                    )}
                </>
            ) : dragOver ? (
                <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-10 h-10 text-[color:var(--color-brand-500)]" />
                    <span className="text-[13px] font-bold text-[color:var(--color-brand-600)]">{tDropToUpload}</span>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 p-4">
                    <div className="w-14 h-14 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-200">
                        {emptyIcon}
                    </div>
                    <div className="text-center">
                        <span className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 block">{tClickDragDrop}</span>
                        <span className="text-[11px] text-neutral-400">{tToUpload}</span>
                    </div>
                </div>
            )}
            <input type="file" accept="image/*,image/heic,image/heif,.heic,.heif" onChange={onChange} className="hidden" />
        </label>
    </div>
);

// ─── Field styles ─────────────────────────────────────────────────────────────
const fieldCls = 'peer w-full h-[52px] px-4 pt-5 pb-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-transparent ' +
    'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 ' +
    'transition-all duration-200';

const selectCls = 'w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] dark:text-neutral-100 ' +
    'focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 ' +
    'transition-all duration-200 appearance-none cursor-pointer';

// ─── Main Component ───────────────────────────────────────────────────────────
const RestaurantPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: restaurant, isLoading } = useRestaurant();
    const { mutate: update, isPending } = useUpdateRestaurant();
    const qc = useQueryClient();

    const [tab, setTab] = useState<'en' | 'am'>('en');

    const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<FormData>();
    const status = watch('status');

    const [logoDragOver, setLogoDragOver] = useState(false);
    const [coverDragOver, setCoverDragOver] = useState(false);
    const [logoUploaded, setLogoUploaded] = useState(false);
    const [coverUploaded, setCoverUploaded] = useState(false);
    const [logoProgress, setLogoProgress] = useState<number | null>(null);
    const [coverProgress, setCoverProgress] = useState<number | null>(null);
    const [showWifiPassword, setShowWifiPassword] = useState(false);
    const [socialLinks, setSocialLinks] = useState<SocialMediaEntry[]>([]);
    const initialSocialJson = useRef('[]');
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);

    const logoTimer = useRef<ReturnType<typeof setTimeout>>();
    const coverTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (restaurant) {
            const translations = restaurant.translations ?? [];
            reset({
                nameEn: getTranslation(translations, 'EN', 'name') || restaurant.name || '',
                descEn: getTranslation(translations, 'EN', 'description') || restaurant.description || '',
                addressEn: getTranslation(translations, 'EN', 'address') || restaurant.address || '',
                cityEn: getTranslation(translations, 'EN', 'city') || restaurant.city || '',
                nameAm: getTranslation(translations, 'AM', 'name') || '',
                descAm: getTranslation(translations, 'AM', 'description') || '',
                addressAm: getTranslation(translations, 'AM', 'address') || '',
                cityAm: getTranslation(translations, 'AM', 'city') || '',
                phone: restaurant.phone ?? '',
                email: restaurant.email ?? '',
                country: restaurant.country ?? t('restaurant.ethiopia'),
                defaultLanguage: restaurant.defaultLanguage ?? 'EN',
                currency: restaurant.currency ?? 'ETB',
                status: restaurant.status ?? 'DRAFT',
                wifiName: restaurant.wifiName ?? '',
                wifiPassword: restaurant.wifiPassword ?? '',
                paymentInfo: restaurant.paymentInfo ?? '',
            });
            const originalSocial = Array.isArray(restaurant.socialMedia) ? (restaurant.socialMedia as SocialMediaEntry[]) : [];
            setSocialLinks(originalSocial);
            initialSocialJson.current = JSON.stringify(originalSocial);
        }
    }, [restaurant, reset, t]);

    const isSocialDirty = JSON.stringify(socialLinks.filter(l => l.url.trim() !== '')) !== initialSocialJson.current;
    const isModified = isDirty || isSocialDirty;

    // Warn on browser reload / tab close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isModified) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isModified]);

    // Intercept internal link clicks when there are unsaved changes
    useEffect(() => {
        if (!isModified) return;

        const handleAnchorClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (!href || href.startsWith('#') || target.target === '_blank' || href.startsWith('blob:')) return;

            // If navigating away from the current page
            if (href !== window.location.pathname) {
                e.preventDefault();
                e.stopPropagation();
                setPendingNavHref(href);
                setShowUnsavedModal(true);
            }
        };

        document.addEventListener('click', handleAnchorClick, true);
        return () => document.removeEventListener('click', handleAnchorClick, true);
    }, [isModified]);

    const handleDiscardChanges = () => {
        if (restaurant) {
            const translations = restaurant.translations ?? [];
            reset({
                nameEn: getTranslation(translations, 'EN', 'name') || restaurant.name || '',
                descEn: getTranslation(translations, 'EN', 'description') || restaurant.description || '',
                addressEn: getTranslation(translations, 'EN', 'address') || restaurant.address || '',
                cityEn: getTranslation(translations, 'EN', 'city') || restaurant.city || '',
                nameAm: getTranslation(translations, 'AM', 'name') || '',
                descAm: getTranslation(translations, 'AM', 'description') || '',
                addressAm: getTranslation(translations, 'AM', 'address') || '',
                cityAm: getTranslation(translations, 'AM', 'city') || '',
                phone: restaurant.phone ?? '',
                email: restaurant.email ?? '',
                country: restaurant.country ?? t('restaurant.ethiopia'),
                defaultLanguage: restaurant.defaultLanguage ?? 'EN',
                currency: restaurant.currency ?? 'ETB',
                status: restaurant.status ?? 'DRAFT',
                wifiName: restaurant.wifiName ?? '',
                wifiPassword: restaurant.wifiPassword ?? '',
                paymentInfo: restaurant.paymentInfo ?? '',
            });
            const originalSocial = Array.isArray(restaurant.socialMedia) ? (restaurant.socialMedia as SocialMediaEntry[]) : [];
            setSocialLinks(originalSocial);
            initialSocialJson.current = JSON.stringify(originalSocial);
        }
        setShowUnsavedModal(false);
        if (pendingNavHref) {
            const target = pendingNavHref;
            setPendingNavHref(null);
            navigate(target);
        }
    };

    useEffect(() => () => {
        clearTimeout(logoTimer.current); clearTimeout(coverTimer.current);
    }, []);

    const onSubmit = (data: FormData) => {
        const translations = [
            {
                language: 'EN' as const,
                name: data.nameEn.trim(),
                description: data.descEn.trim() || null,
                address: data.addressEn.trim() || null,
                city: data.cityEn.trim() || null,
            },
            {
                language: 'AM' as const,
                name: data.nameAm.trim() || data.nameEn.trim(),
                description: data.descAm.trim() || null,
                address: data.addressAm.trim() || null,
                city: data.cityAm.trim() || null,
            },
        ];

        const normalizedSocial = socialLinks
            .filter(l => l.url.trim() !== '')
            .map(l => {
                const platformCfg = PLATFORMS.find(p => p.id.toLowerCase() === l.platform.toLowerCase());
                return {
                    platform: l.platform,
                    url: platformCfg ? platformCfg.normalizeUrl(l.url) : l.url.trim()
                };
            });

        const payload = {
            name: data.nameEn.trim(),
            description: data.descEn.trim() || null,
            address: data.addressEn.trim() || null,
            city: data.cityEn.trim() || null,
            phone: data.phone.trim() || null,
            email: data.email.trim() || null,
            country: data.country.trim() || 'Ethiopia',
            defaultLanguage: data.defaultLanguage,
            currency: data.currency,
            status: data.status,
            wifiName: data.wifiName?.trim() || null,
            wifiPassword: data.wifiPassword?.trim() || null,
            paymentInfo: data.paymentInfo?.trim() || null,
            socialMedia: normalizedSocial,
            translations,
        };

        update(payload, {
            onSuccess: () => {
                setSocialLinks(normalizedSocial);
                initialSocialJson.current = JSON.stringify(normalizedSocial);
                reset(data);
                if (pendingNavHref) {
                    const target = pendingNavHref;
                    setPendingNavHref(null);
                    setShowUnsavedModal(false);
                    navigate(target);
                }
            },
        });
    };

    const handleSaveAndLeave = () => {
        handleSubmit(onSubmit)();
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setLogoProgress(0);
            const compressed = await compressImage(file, { maxDimension: 1200, quality: 0.85 });
            await restaurantApi.uploadLogo(compressed, (percent) => setLogoProgress(percent));
            await qc.invalidateQueries({ queryKey: ['restaurant'] });
            toast.success(t('toast.uploaded'));
            setLogoUploaded(true);
            logoTimer.current = setTimeout(() => setLogoUploaded(false), 3000);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || t('toast.error'));
        } finally {
            setLogoProgress(null);
            e.target.value = '';
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setCoverProgress(0);
            const compressed = await compressImage(file, { maxDimension: 2000, quality: 0.82 });
            await restaurantApi.uploadCover(compressed, (percent) => setCoverProgress(percent));
            await qc.invalidateQueries({ queryKey: ['restaurant'] });
            toast.success(t('toast.uploaded'));
            setCoverUploaded(true);
            coverTimer.current = setTimeout(() => setCoverUploaded(false), 3000);
        } catch (error: any) {
            toast.error(error?.response?.data?.error || t('toast.error'));
        } finally {
            setCoverProgress(null);
            e.target.value = '';
        }
    };

    if (isLoading) return (
        <div className="p-6 lg:p-10 max-w-4xl mx-auto"><SkeletonList count={8} /></div>
    );

    const isPublished = restaurant?.status === 'PUBLISHED';

    return (
        <>
            <Helmet><title>{t('restaurant.title')} — QR Menu</title></Helmet>
            <div className="min-h-full bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/90 dark:to-neutral-900 p-4 lg:p-10 max-w-4xl mx-auto pb-24 lg:pb-12 transition-colors duration-200">

                {/* ── Page header ── */}
                <div className="animate-fade-in-up delay-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('restaurant.title')}</h1>
                        {restaurant?.slug && (
                            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="font-mono text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] font-semibold">/r/{restaurant.slug}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={isPublished ? 'success' : 'neutral'}>
                            {isPublished
                                ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />{t('status.published')}</>
                                : t('status.draft')
                            }
                        </Badge>
                        {restaurant && (
                            <a href={`/r/${restaurant.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="h-10 hover:-translate-y-0.5 transition-transform dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" icon={<Eye className="w-4 h-4" />}>
                                    {t('nav.viewMenu')}
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-7 pb-32 sm:pb-36">

                    {/* ── 1. Brand Identity ── */}
                    <SectionCard
                        icon={<ImagePlus className="w-5 h-5" />}
                        title={t('restaurant.brand_identity', { defaultValue: 'Brand Identity' })}
                        subtitle={t('restaurant.brand_identity_desc', { defaultValue: 'Upload a logo and cover image to personalize your menu.' })}
                        gradient
                        delay="75ms"
                    >
                        {/* Decorative sparkle */}
                        <Sparkles className="absolute top-6 right-20 w-32 h-32 text-[color:var(--color-brand-500)] opacity-[0.04] dark:opacity-10" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UploadZone
                                aspect="aspect-square"
                                dragOver={logoDragOver}
                                onDragOver={e => { e.preventDefault(); setLogoDragOver(true); }}
                                onDragLeave={() => setLogoDragOver(false)}
                                onDrop={() => setLogoDragOver(false)}
                                onChange={handleLogoUpload}
                                imageUrl={restaurant?.logoUrl}
                                label={t('restaurant.logo')}
                                hint={t('restaurant.logoHint')}
                                emptyIcon={<Store className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                                uploaded={logoUploaded}
                                progress={logoProgress}
                                tChangeImage={t("restaurant.change_image")}
                                tDropToUpload={t("restaurant.drop_to_upload")}
                                tToUpload={t("restaurant.to_upload")}
                                tClickDragDrop={t("restaurant.click_drag_drop")}
                            />
                            <UploadZone
                                aspect="aspect-[3/2]"
                                dragOver={coverDragOver}
                                onDragOver={e => { e.preventDefault(); setCoverDragOver(true); }}
                                onDragLeave={() => setCoverDragOver(false)}
                                onDrop={() => setCoverDragOver(false)}
                                onChange={handleCoverUpload}
                                imageUrl={restaurant?.coverImageUrl}
                                label={t('restaurant.cover')}
                                hint={t('restaurant.coverHint')}
                                emptyIcon={<ImagePlus className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                                uploaded={coverUploaded}
                                progress={coverProgress}
                                tChangeImage={t("restaurant.change_image")}
                                tDropToUpload={t("restaurant.drop_to_upload")}
                                tToUpload={t("restaurant.to_upload")}
                                tClickDragDrop={t("restaurant.click_drag_drop")}
                            />
                        </div>
                    </SectionCard>

                    {/* ── 2. Business Profile ── */}
                    <SectionCard
                        icon={<Building2 className="w-5 h-5" />}
                        title={t('restaurant.biz_profile', { defaultValue: 'Business Profile' })}
                        subtitle={t('restaurant.biz_profile_desc', { defaultValue: 'Contact information and location details.' })}
                        delay="150ms"
                    >
                        {/* Language tab switcher */}
                        <div className="flex items-center justify-between gap-2 pb-2">
                            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                                {(['en', 'am'] as const).map(l => (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setTab(l)}
                                        className={cn(
                                            'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5',
                                            tab === l
                                                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                        )}
                                    >
                                        <span>{l === 'en' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}</span>
                                    </button>
                                ))}
                            </div>
                            <span className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                                {tab === 'en' ? t('restaurant.english_details', 'English Details') : t('restaurant.amharic_details', 'የአማርኛ ዝርዝሮች')}
                            </span>
                        </div>

                        {/* Localized fields */}
                        {tab === 'en' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 animate-fade-in">
                                {/* Restaurant Name (EN) */}
                                <div className="md:col-span-2 relative">
                                    <input {...register('nameEn')} type="text" placeholder={t("restaurant.ph_name_en")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none transition-all">
                                        {t('restaurant.name_en')} <span className="text-red-500">*</span>
                                    </label>
                                </div>

                                {/* Address (EN) */}
                                <div className="relative">
                                    <input {...register('addressEn')} type="text" placeholder={t("restaurant.ph_address_en")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.address_en')}</label>
                                </div>

                                {/* City (EN) */}
                                <div className="relative">
                                    <input {...register('cityEn')} type="text" placeholder={t("restaurant.ph_city_en")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.city_en')}</label>
                                </div>

                                {/* Description (EN) */}
                                <div className="md:col-span-2 relative">
                                    <textarea
                                        {...register('descEn')}
                                        placeholder={t("restaurant.ph_desc_en")}
                                        className="peer w-full min-h-[110px] px-4 pt-7 pb-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-transparent resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all duration-200"
                                    />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.desc_en')}</label>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 font-ethiopic animate-fade-in">
                                {/* Restaurant Name (AM) */}
                                <div className="md:col-span-2 relative">
                                    <input {...register('nameAm')} type="text" placeholder={t("restaurant.ph_name_am")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none transition-all">
                                        {t('restaurant.name_am')}
                                    </label>
                                </div>

                                {/* Address (AM) */}
                                <div className="relative">
                                    <input {...register('addressAm')} type="text" placeholder={t("restaurant.ph_address_am")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.address_am')}</label>
                                </div>

                                {/* City (AM) */}
                                <div className="relative">
                                    <input {...register('cityAm')} type="text" placeholder={t("restaurant.ph_city_am")} className={fieldCls} />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.city_am')}</label>
                                </div>

                                {/* Description (AM) */}
                                <div className="md:col-span-2 relative">
                                    <textarea
                                        {...register('descAm')}
                                        placeholder={t("restaurant.ph_desc_am")}
                                        className="peer w-full min-h-[110px] px-4 pt-7 pb-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-transparent resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all duration-200 font-ethiopic"
                                    />
                                    <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.desc_am')}</label>
                                </div>
                            </div>
                        )}

                        {/* Shared contact & country fields */}
                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                            {/* Phone */}
                            <div className="relative">
                                <input {...register('phone')} type="tel" inputMode="tel" placeholder={t("restaurant.ph_phone")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.phone')}</label>
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <input {...register('email')} type="email" inputMode="email" placeholder={t("restaurant.ph_email")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.email')}</label>
                            </div>

                            {/* Country */}
                            <div className="relative">
                                <input {...register('country')} type="text" placeholder={t("restaurant.ph_country")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.country')}</label>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── 3. Operational Settings ── */}
                    <SectionCard
                        icon={<Globe className="w-5 h-5" />}
                        title={t('restaurant.operational_settings', { defaultValue: 'Operational Settings' })}
                        subtitle={t('restaurant.operational_settings_desc', { defaultValue: 'Configure language, currency, and menu visibility.' })}
                        delay="225ms"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Language */}
                            <div>
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{t('restaurant.language')}</label>
                                <select {...register('defaultLanguage')} className={selectCls}>
                                    <option value="EN">🇬🇧 English</option>
                                    <option value="AM">🇪🇹 አማርኛ (Amharic)</option>
                                </select>
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{t('restaurant.currency')}</label>
                                <select {...register('currency')} className={selectCls}>
                                    <option value="ETB">{t('restaurant.currencies.ETB', { defaultValue: 'ETB — Ethiopian Birr' })}</option>
                                    <option value="USD">{t('restaurant.currencies.USD', { defaultValue: 'USD — US Dollar' })}</option>
                                    <option value="EUR">{t('restaurant.currencies.EUR', { defaultValue: 'EUR — Euro' })}</option>
                                    <option value="GBP">{t('restaurant.currencies.GBP', { defaultValue: 'GBP — British Pound' })}</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{t('dashboard.menu_status')}</label>
                                <select
                                    {...register('status')}
                                    className={cn(selectCls,
                                        status === 'PUBLISHED'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 focus:ring-emerald-400/50 focus:border-emerald-400'
                                            : ''
                                    )}
                                >
                                    <option value="DRAFT">⚪ {t('status.draft')}</option>
                                    <option value="PUBLISHED">🟢 {t('status.published')}</option>
                                </select>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ── 4. Additional Information (WiFi, Payment, Social) ── */}
                    <SectionCard
                        icon={<Info className="w-5 h-5" />}
                        title={t('restaurant.additional_info', { defaultValue: 'Additional Information' })}
                        subtitle={t('restaurant.additional_info_desc', { defaultValue: 'Configure guest WiFi, payment methods, and social links.' })}
                        delay="275ms"
                    >
                        <div className="space-y-6">
                            {/* A. WiFi Details */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold text-[14px]">
                                    <Wifi className="w-4 h-4 text-[color:var(--color-brand-500)]" />
                                    <span>{t('restaurant.wifi_details', { defaultValue: 'Guest WiFi Details' })}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input
                                            {...register('wifiName')}
                                            type="text"
                                            placeholder={t('restaurant.wifi_name_ph', { defaultValue: 'e.g. BlueNile_Guest_WiFi' })}
                                            className={fieldCls}
                                        />
                                        <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">
                                            {t('restaurant.wifi_name', { defaultValue: 'WiFi Network Name (SSID)' })}
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <input
                                            {...register('wifiPassword')}
                                            type={showWifiPassword ? 'text' : 'password'}
                                            placeholder={t('restaurant.wifi_password_ph', { defaultValue: 'e.g. NileGuest2026' })}
                                            className={cn(fieldCls, 'pr-12')}
                                        />
                                        <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">
                                            {t('restaurant.wifi_password', { defaultValue: 'WiFi Password' })}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowWifiPassword(!showWifiPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                                            aria-label={showWifiPassword ? t('restaurant.hide_password') : t('restaurant.show_password')}
                                        >
                                            {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* B. Payment Information */}
                            <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                                <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold text-[14px]">
                                    <CreditCard className="w-4 h-4 text-[color:var(--color-brand-500)]" />
                                    <span>{t('restaurant.payment_info', { defaultValue: 'Payment Information & Methods' })}</span>
                                </div>
                                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                    {t('restaurant.payment_info_desc', { defaultValue: 'Describe accepted payment methods (bank accounts, Telebirr, CBE Birr, cards, or cash instructions).' })}
                                </p>
                                <textarea
                                    {...register('paymentInfo')}
                                    rows={4}
                                    placeholder={t('restaurant.payment_info_ph', { defaultValue: 'e.g. We accept Telebirr (0911...), CBE Account (1000...), Commercial Bank Cards, and Cash.' })}
                                    className={cn(
                                        'w-full p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/90 dark:border-neutral-700/80 text-[14px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all resize-y min-h-[100px]'
                                    )}
                                />
                            </div>

                            {/* C. Social Media Dynamic List */}
                            <SocialLinksManager
                                links={socialLinks}
                                onChange={(updated) => {
                                    setSocialLinks(updated);
                                    initialSocialJson.current = JSON.stringify(updated);
                                }}
                            />
                        </div>
                    </SectionCard>

                    {/* ── Sticky Floating Save Bar ── */}
                    <div className="fixed bottom-0 lg:bottom-6 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none pb-20 lg:pb-0">
                        <div className="pointer-events-auto max-w-3xl w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 p-3 sm:px-6 flex items-center justify-between gap-4 transition-all duration-300">
                            <div className="flex items-center gap-2.5">
                                {isModified ? (
                                    <>
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <span className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
                                            {t('restaurant.unsaved_changes', { defaultValue: 'You have unsaved changes' })}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
                                            {t('restaurant.all_saved', { defaultValue: 'All changes saved' })}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isModified && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDiscardChanges}
                                        className="h-10 text-[13px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                                    >
                                        {t('common.discard', { defaultValue: 'Discard' })}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    className="h-10 px-6 text-[13px] font-semibold"
                                    isLoading={isPending}
                                    icon={<Save className="w-4 h-4" />}
                                >
                                    {t('restaurant.save', { defaultValue: 'Save Changes' })}
                                </Button>
                            </div>
                        </div>
                    </div>

                </form>

                {/* ── Unsaved Changes Navigation Modal ── */}
                {showUnsavedModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                        {t('restaurant.unsaved_modal_title', { defaultValue: 'Unsaved Changes' })}
                                    </h3>
                                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        {t('restaurant.unsaved_modal_desc', { defaultValue: 'You have unsaved changes on your profile. What would you like to do before leaving?' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowUnsavedModal(false)}
                                    className="w-full sm:w-auto h-10 text-[13px]"
                                >
                                    {t('restaurant.stay_on_page', { defaultValue: 'Stay on Page' })}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleDiscardChanges}
                                    className="w-full sm:w-auto h-10 text-[13px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                    {t('common.discard_and_leave', { defaultValue: 'Discard & Leave' })}
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleSaveAndLeave}
                                    isLoading={isPending}
                                    className="w-full sm:w-auto h-10 text-[13px] font-semibold"
                                >
                                    {t('common.save_and_leave', { defaultValue: 'Save Changes' })}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RestaurantPage;
