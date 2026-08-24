import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Save, Globe, Eye, ImagePlus, UploadCloud,
    Building2, Store, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useRestaurant, useUpdateRestaurant } from '../../hooks/useRestaurant';
import { restaurantApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
    name: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
    defaultLanguage: 'EN' | 'AM';
    currency: string;
    status: 'DRAFT' | 'PUBLISHED';
}

// ─── Floating Label Field ─────────────────────────────────────────────────────
interface FloatingFieldProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    colSpan?: boolean;
}

const FloatingField: React.FC<FloatingFieldProps> = ({ label, required, children, colSpan }) => (
    <div className={cn('relative group', colSpan && 'md:col-span-2')}>
        <div className="relative">
            {children}
            <label className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-neutral-400 pointer-events-none',
                'transition-all duration-200 ease-out',
                'peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-[color:var(--color-brand-600)] peer-focus:tracking-wide',
                'peer-[&:not(:placeholder-shown)]:top-2.5 peer-[&:not(:placeholder-shown)]:-translate-y-0 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:font-bold peer-[&:not(:placeholder-shown)]:text-neutral-500 peer-[&:not(:placeholder-shown)]:tracking-wide',
            )}>
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
        </div>
    </div>
);

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
    tChangeImage: string;
    tDropToUpload: string;
    tToUpload: string;
    tClickDragDrop: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
    aspect, dragOver, onDragOver, onDragLeave, onDrop, onChange,
    imageUrl, label, hint, emptyIcon, uploaded,
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
            <input type="file" accept="image/*" onChange={onChange} className="hidden" />
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
    const { data: restaurant, isLoading } = useRestaurant();
    const { mutate: update, isPending } = useUpdateRestaurant();
    const qc = useQueryClient();

    const { register, handleSubmit, reset, watch } = useForm<FormData>();
    const status = watch('status');

    const [logoDragOver, setLogoDragOver] = useState(false);
    const [coverDragOver, setCoverDragOver] = useState(false);
    const [logoUploaded, setLogoUploaded] = useState(false);
    const [coverUploaded, setCoverUploaded] = useState(false);
    const logoTimer = useRef<ReturnType<typeof setTimeout>>();
    const coverTimer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (restaurant) {
            reset({
                name: restaurant.name ?? '',
                description: restaurant.description ?? '',
                phone: restaurant.phone ?? '',
                email: restaurant.email ?? '',
                address: restaurant.address ?? '',
                city: restaurant.city ?? '',
                country: restaurant.country ?? t('restaurant.ethiopia'),
                defaultLanguage: restaurant.defaultLanguage ?? 'EN',
                currency: restaurant.currency ?? 'ETB',
                status: restaurant.status ?? 'DRAFT',
            });
        }
    }, [restaurant, reset]);

    useEffect(() => () => {
        clearTimeout(logoTimer.current); clearTimeout(coverTimer.current);
    }, []);

    const onSubmit = (data: FormData) => update(data);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await restaurantApi.uploadLogo(file);
            await qc.invalidateQueries({ queryKey: ['restaurant'] });
            toast.success(t('toast.uploaded'));
            setLogoUploaded(true);
            logoTimer.current = setTimeout(() => setLogoUploaded(false), 3000);
        } catch { toast.error(t('toast.error')); }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await restaurantApi.uploadCover(file);
            await qc.invalidateQueries({ queryKey: ['restaurant'] });
            toast.success(t('toast.uploaded'));
            setCoverUploaded(true);
            coverTimer.current = setTimeout(() => setCoverUploaded(false), 3000);
        } catch { toast.error(t('toast.error')); }
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-7">

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
                                hint="PNG, JPG · max 2MB"
                                emptyIcon={<Store className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                                uploaded={logoUploaded}
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
                                hint="Recommended 1200×400px · max 5MB"
                                emptyIcon={<ImagePlus className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />}
                                tChangeImage={t("restaurant.change_image")}
                                uploaded={coverUploaded}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">

                            {/* Restaurant Name — full width, floating label */}
                            <div className="md:col-span-2 relative">
                                <input {...register('name')} type="text" placeholder={t("restaurant.ph_name")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none transition-all">
                                    {t('restaurant.name')} <span className="text-red-500">*</span>
                                </label>
                            </div>

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

                            {/* Address — full width */}
                            <div className="md:col-span-2 relative">
                                <input {...register('address')} type="text" placeholder={t("restaurant.ph_address")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.address')}</label>
                            </div>

                            {/* City */}
                            <div className="relative">
                                <input {...register('city')} type="text" placeholder={t("restaurant.ph_city")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.city')}</label>
                            </div>

                            {/* Country */}
                            <div className="relative">
                                <input {...register('country')} type="text" placeholder={t("restaurant.ph_country")} className={fieldCls} />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.country')}</label>
                            </div>

                            {/* Description — full width, taller */}
                            <div className="md:col-span-2 relative">
                                <textarea
                                    {...register('description')}
                                    placeholder={t("restaurant.ph_desc")}
                                    className="peer w-full min-h-[110px] px-4 pt-7 pb-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800/50 text-[15px] text-neutral-900 dark:text-neutral-100 placeholder-transparent resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/50 focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-neutral-900 transition-all duration-200"
                                />
                                <label className="absolute left-4 top-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wide pointer-events-none">{t('restaurant.description')}</label>
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
                                    <option value="ETB">ETB — Ethiopian Birr</option>
                                    <option value="USD">USD — US Dollar</option>
                                    <option value="EUR">EUR — Euro</option>
                                    <option value="GBP">GBP — British Pound</option>
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

                    {/* ── Save ── */}
                    <div className="animate-fade-in-up flex justify-start" style={{ animationDelay: '300ms' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full sm:w-auto h-12 px-10 text-[15px] hover:-translate-y-0.5 transition-transform"
                            isLoading={isPending}
                            icon={<Save className="w-5 h-5" />}
                        >
                            {t('restaurant.save')}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    );
};

export default RestaurantPage;
