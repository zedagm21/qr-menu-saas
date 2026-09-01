import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Save, Monitor, Smartphone, Tablet,
    RotateCcw, ExternalLink, Check, Palette,
} from 'lucide-react';
import { useRestaurant, useUpdateTheme } from '../../hooks/useRestaurant';
import { useMenuItems } from '../../hooks/useMenuItems';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { getTranslation, formatCurrency, cn } from '../../lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MenuStyle = 'CLASSIC' | 'MODERN' | 'ELEGANT' | 'MINIMAL';
type DarkMode = 'LIGHT' | 'DARK' | 'AUTO';

interface ThemeForm {
    menuStyle: MenuStyle;
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    darkMode: DarkMode;
}

const DEFAULTS: ThemeForm = {
    menuStyle: 'CLASSIC',
    primaryColor: '#D97706',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    darkMode: 'AUTO',
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STYLES: { value: MenuStyle; label: string; desc: string; emoji: string }[] = [
    { value: 'CLASSIC', label: 'Classic', desc: 'Traditional multi-grid with rectangular cards', emoji: '🍽️' },
    { value: 'MODERN', label: 'Modern', desc: 'Clean multi-grid with circular dish images', emoji: '✨' },
    { value: 'ELEGANT', label: 'Elegant', desc: 'Editorial serif typography and layout', emoji: '🌿' },
    { value: 'MINIMAL', label: 'Minimal', desc: 'Ultra-clean compact presentation', emoji: '⬜' },
];

const PRESETS: { label: string; primary: string; accent: string }[] = [
    // Original 8
    { label: 'Amber', primary: '#D97706', accent: '#F59E0B' },
    { label: 'Purple', primary: '#7C3AED', accent: '#A78BFA' },
    { label: 'Emerald', primary: '#059669', accent: '#34D399' },
    { label: 'Red', primary: '#DC2626', accent: '#F87171' },
    { label: 'Sky', primary: '#0EA5E9', accent: '#38BDF8' },
    { label: 'Pink', primary: '#EC4899', accent: '#F9A8D4' },
    { label: 'Slate', primary: '#1a1a1a', accent: '#404040' },
    { label: 'Stone', primary: '#78716C', accent: '#A8A29E' },
    // 6 New presets
    { label: 'Café', primary: '#6B4F3C', accent: '#A67B5B' },
    { label: 'Fine Dining', primary: '#1A1A2E', accent: '#C5A059' },
    { label: 'Fast Food', primary: '#E63946', accent: '#F4A261' },
    { label: 'Vibrant', primary: '#8B5CF6', accent: '#D946EF' },
    { label: 'Nature', primary: '#2D6A4F', accent: '#52B788' },
    { label: 'Ocean', primary: '#0077B6', accent: '#48CAE4' },
];

const FONTS = ['Inter', 'Playfair Display', 'Space Grotesk', 'Georgia', 'Lato'];

const HEX_FULL_RE = /^#[0-9A-Fa-f]{6}$/;

// ─────────────────────────────────────────────
// Hex Input (controlled text + color picker pair)
// ─────────────────────────────────────────────
interface HexInputProps {
    label: string;
    value: string;
    onChange: (hex: string) => void;
}

const HexInput: React.FC<HexInputProps> = ({ label, value, onChange }) => {
    // Local text state allows partial typing without resetting cursor
    const [text, setText] = useState(value);

    // Keep in sync when parent value changes (preset click, reset)
    useEffect(() => { setText(value); }, [value]);

    const handleText = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        setText(v);
        if (HEX_FULL_RE.test(v)) onChange(v);
    }, [onChange]);

    const handleBlur = () => {
        // On blur, revert to last valid value if text is incomplete
        if (!HEX_FULL_RE.test(text)) setText(value);
    };

    return (
        <div>
            <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">
                {label}
            </label>
            <div className="flex items-center gap-2">
                {/* Native color picker trigger */}
                <label
                    className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer overflow-hidden flex-shrink-0 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                    style={{ background: value }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={e => { onChange(e.target.value); setText(e.target.value); }}
                        className="opacity-0 w-full h-full cursor-pointer"
                    />
                </label>
                {/* Text hex input — live partial typing */}
                <input
                    type="text"
                    value={text}
                    maxLength={7}
                    onChange={handleText}
                    onBlur={handleBlur}
                    placeholder="#D97706"
                    spellCheck={false}
                    className="flex-1 h-11 sm:h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[13px] font-mono bg-neutral-50 dark:bg-neutral-800/50 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/40 focus:border-[color:var(--color-brand-500)] text-neutral-900 dark:text-neutral-100 transition-all"
                />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const CustomizePage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { restaurant: authRestaurant } = useAuth();
    const { data: restaurant, isLoading } = useRestaurant();
    const { data: menuItemsData } = useMenuItems();
    const { mutate: updateTheme, isPending } = useUpdateTheme();
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
    // Key used to trigger fade-in animation on preview when theme changes
    const [previewKey, setPreviewKey] = useState(0);

    const { register, handleSubmit, watch, setValue, reset } = useForm<ThemeForm>({
        defaultValues: DEFAULTS,
    });

    useEffect(() => {
        if (restaurant?.theme) {
            const th = restaurant.theme;
            reset({
                menuStyle: (th.menuStyle as MenuStyle) ?? DEFAULTS.menuStyle,
                primaryColor: th.primaryColor ?? DEFAULTS.primaryColor,
                accentColor: th.accentColor ?? DEFAULTS.accentColor,
                fontFamily: th.fontFamily ?? DEFAULTS.fontFamily,
                darkMode: (th.darkMode as DarkMode) ?? DEFAULTS.darkMode,
            });
        }
    }, [restaurant, reset]);

    const watched = watch();

    // Trigger preview animation whenever any theme value changes
    useEffect(() => {
        setPreviewKey(k => k + 1);
    }, [watched.primaryColor, watched.accentColor, watched.fontFamily, watched.menuStyle, watched.darkMode]);

    const menuItems = Array.isArray(menuItemsData) ? menuItemsData.slice(0, 6) : [];
    const onSubmit = (data: ThemeForm) => updateTheme(data);
    const handleReset = () => reset(DEFAULTS);

    const slug = authRestaurant?.slug ?? restaurant?.slug;

    const isDark = watched.darkMode === 'DARK';
    const bgColor = isDark ? '#121212' : '#F9FAFB';
    const textColor = isDark ? '#F9FAFB' : '#111827';
    const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)';
    const cardBorder = isDark ? '#333333' : '#E5E7EB';

    if (isLoading) return <div className="p-8"><SkeletonList count={5} /></div>;

    return (
        <>
            <Helmet><title>{t('customize.title')} — QR Menu</title></Helmet>
            <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('customize.title')}</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('customize.subtitle')}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {slug && (
                            <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline"
                                    className="h-10 px-4 rounded-xl text-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                                    icon={<ExternalLink className="w-4 h-4" />}
                                >
                                    {t('customize.view_live_menu')}
                                </Button>
                            </a>
                        )}
                        <Button
                            variant="ghost"
                            className="h-10 px-4 rounded-xl text-sm text-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            onClick={handleReset}
                            icon={<RotateCcw className="w-4 h-4" />}
                        >
                            {t('customize.reset_to_default')}
                        </Button>
                    </div>
                </div>

                {/* ── Theme Summary Card ── */}
                <div className="bg-white dark:bg-neutral-900/95 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-neutral-400" />
                        <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest">{t('customize.current_theme')}</span>
                    </div>
                    {/* Primary color swatch + hex */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full ring-1 ring-black/10 shadow-sm transition-all duration-300" style={{ background: watched.primaryColor }} />
                        <span className="text-[12px] font-mono font-bold text-neutral-700 dark:text-neutral-300">{watched.primaryColor}</span>
                    </div>
                    {/* Accent color swatch + hex */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full ring-1 ring-black/10 shadow-sm transition-all duration-300" style={{ background: watched.accentColor }} />
                        <span className="text-[12px] font-mono font-bold text-neutral-700 dark:text-neutral-300">{watched.accentColor}</span>
                    </div>
                    <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg">{watched.fontFamily}</span>
                    <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg">{watched.menuStyle}</span>
                    <span className="text-[12px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg">{watched.darkMode}</span>
                </div>

                {/* ── 2-col layout ── */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:items-start">

                    {/* ─── Controls form ─── */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-5">

                        {/* Layout Style */}
                        <div className="bg-white dark:bg-neutral-900/95 rounded-[24px] border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                            <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight mb-5">{t('customize.layout_style')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {STYLES.map(s => {
                                    const isSelected = watched.menuStyle === s.value;
                                    return (
                                        <label
                                            key={s.value}
                                            className={cn(
                                                'relative flex flex-col gap-2 p-4 sm:p-5 rounded-[20px] border-2 cursor-pointer transition-all active:scale-95 group',
                                                isSelected
                                                    ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)]/40 dark:bg-[color:var(--color-brand-500)]/10 shadow-sm'
                                                    : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50'
                                            )}
                                        >
                                            <input type="radio" value={s.value} {...register('menuStyle')} className="sr-only" />
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{s.emoji}</span>
                                                {/* Selection checkmark */}
                                                <div className={cn(
                                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                                                    isSelected
                                                        ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)]'
                                                        : 'border-neutral-300 dark:border-neutral-700'
                                                )}>
                                                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                                                    {t(`customize.styles.${s.value.toLowerCase()}.label`, { defaultValue: s.label })}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-snug mt-0.5">
                                                    {t(`customize.styles.${s.value.toLowerCase()}.desc`, { defaultValue: s.desc })}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="bg-white dark:bg-neutral-900/95 rounded-[24px] border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] space-y-4 sm:space-y-5">
                            <h2 className="text-[17px] font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('customize.color_palette')}</h2>

                            {/* Presets grid */}
                            <div>
                                <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest block mb-3">{t('customize.theme_presets')}</label>
                                <div className="flex gap-2 sm:gap-2.5 flex-wrap">
                                    {PRESETS.map((p, i) => {
                                        const isSelected = watched.primaryColor === p.primary && watched.accentColor === p.accent;
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => { setValue('primaryColor', p.primary, { shouldDirty: true }); setValue('accentColor', p.accent, { shouldDirty: true }); }}
                                                    title={t(`customize.presets.${p.label.toLowerCase().replace(' ', '_')}`, { defaultValue: p.label })}
                                                    className={cn(
                                                        'w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[3px] shadow-sm hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center',
                                                        isSelected
                                                            ? 'border-white dark:border-neutral-900 ring-2 ring-[color:var(--color-brand-500)] ring-offset-2 scale-105'
                                                            : 'border-white dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/10'
                                                    )}
                                                    style={{ background: `linear-gradient(135deg, ${p.primary} 0%, ${p.accent} 100%)` }}
                                                >
                                                    {isSelected && <div className="w-4 h-4 bg-white rounded-full shadow-sm" />}
                                                </button>
                                                <span className="text-[10px] font-bold text-neutral-500 max-w-[48px] text-center leading-tight">
                                                    {t(`customize.presets.${p.label.toLowerCase().replace(' ', '_')}`, { defaultValue: p.label })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom hex inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                                <HexInput
                                    label={t('customize.primary_color')}
                                    value={watched.primaryColor}
                                    onChange={v => setValue('primaryColor', v, { shouldDirty: true })}
                                />
                                <HexInput
                                    label={t('customize.accent_color')}
                                    value={watched.accentColor}
                                    onChange={v => setValue('accentColor', v, { shouldDirty: true })}
                                />
                            </div>
                        </div>

                        {/* Font & Dark mode */}
                        <div className="bg-white dark:bg-neutral-900/95 rounded-[24px] border border-neutral-200/60 dark:border-neutral-800/60 p-4 sm:p-5 lg:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                            <div>
                                <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">{t('customize.font')}</label>
                                <select
                                    {...register('fontFamily')}
                                    className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/40 bg-neutral-50 dark:bg-neutral-800/50 focus:bg-white dark:focus:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                                >
                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[12px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">{t('customize.theme')}</label>
                                <select
                                    {...register('darkMode')}
                                    className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[14px] font-bold focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/40 bg-neutral-50 dark:bg-neutral-800/50 focus:bg-white dark:focus:bg-neutral-900 text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                                >
                                    <option value="LIGHT">🌞 {t('customize.dark_mode_light')}</option>
                                    <option value="DARK">🌙 {t('customize.dark_mode_dark')}</option>
                                    <option value="AUTO">⚙️ {t('customize.dark_mode_auto')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex justify-start pt-1">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full sm:w-auto h-12 px-10 text-[15px]"
                                isLoading={isPending}
                                icon={<Save className="w-5 h-5" />}
                            >
                                {t('customize.save')}
                            </Button>
                        </div>
                    </form>

                    {/* ─── Visual Preview ─── */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 lg:bg-white lg:dark:bg-neutral-900/95 rounded-2xl lg:border border-neutral-100 dark:border-neutral-800 lg:p-6 xl:sticky xl:top-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-neutral-900 dark:text-neutral-50">{t('customize.preview')}</h2>
                            {/* Device switcher */}
                            <div className="flex gap-1 bg-white dark:bg-neutral-800 lg:bg-neutral-100 lg:dark:bg-neutral-800/80 rounded-xl p-1 shadow-sm lg:shadow-none border border-neutral-200 dark:border-neutral-700 lg:border-none">
                                {([
                                    { key: 'mobile', icon: <Smartphone className="w-5 h-5 lg:w-4 lg:h-4" />, label: t('customize.mobile') },
                                    { key: 'tablet', icon: <Tablet className="w-5 h-5 lg:w-4 lg:h-4" />, label: t('customize.tablet') },
                                    { key: 'desktop', icon: <Monitor className="w-5 h-5 lg:w-4 lg:h-4" />, label: t('customize.desktop') },
                                ] as const).map(d => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        title={d.label}
                                        onClick={() => setPreviewDevice(d.key as typeof previewDevice)}
                                        className={`p-2 lg:p-1.5 rounded-lg transition-colors ${previewDevice === d.key ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                                            }`}
                                    >
                                        {d.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview frame */}
                        <div
                            className={cn(
                                'mx-auto overflow-hidden rounded-2xl border-4 lg:border border-neutral-200 dark:border-neutral-700 lg:border-neutral-100 lg:dark:border-neutral-800 transition-all duration-500 shadow-xl lg:shadow-sm',
                                previewDevice === 'mobile' ? 'max-w-[320px] lg:max-w-[280px] aspect-[9/19]' :
                                    previewDevice === 'tablet' ? 'max-w-[480px] aspect-[3/4]' : 'max-w-full aspect-video'
                            )}
                            style={{
                                '--color-primary': watched.primaryColor,
                                '--color-accent': watched.accentColor,
                                fontFamily: (watched.fontFamily === 'Playfair Display' || watched.fontFamily === 'Georgia')
                                    ? `'${watched.fontFamily}', 'Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'Nyala', serif`
                                    : `'${watched.fontFamily}', 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif`,
                                backgroundColor: bgColor,
                                color: textColor,
                                transition: 'background-color 0.5s, color 0.5s',
                            } as React.CSSProperties}
                        >
                            {/* Device notch */}
                            <div className="h-6 w-full bg-black/5 flex items-center justify-center flex-shrink-0">
                                {previewDevice === 'mobile' && <div className="w-20 h-3.5 bg-black/10 rounded-full" />}
                            </div>

                            <div
                                key={previewKey}
                                className="p-3 sm:p-4 overflow-y-auto hide-scrollbar h-full animate-[fadeIn_0.35s_ease-out]"
                                style={{ color: textColor }}
                            >
                                {/* Restaurant header */}
                                <div className="flex items-center gap-3 mb-3">
                                    {restaurant?.logoUrl ? (
                                        <img src={restaurant.logoUrl} alt="" className="w-9 h-9 rounded-xl object-cover shadow-sm flex-shrink-0" />
                                    ) : (
                                        <div
                                            className="w-9 h-9 rounded-xl shadow-sm flex-shrink-0 transition-all duration-500"
                                            style={{ background: watched.primaryColor }}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[13px] sm:text-sm font-bold leading-tight truncate">{restaurant?.name ?? t('auth.restaurantName')}</p>
                                        <p className="text-[10px] sm:text-[11px] opacity-60 mt-0.5">⭐ {t('customize.preview')}</p>
                                    </div>
                                </div>

                                {/* Color accent bar */}
                                <div
                                    className="h-1 rounded-full mb-3.5 opacity-60 transition-all duration-500"
                                    style={{ background: `linear-gradient(90deg, ${watched.primaryColor}, ${watched.accentColor})` }}
                                />

                                {/* Menu items */}
                                <div className={cn(
                                    (watched.menuStyle === 'CLASSIC' || watched.menuStyle === 'MODERN')
                                        ? 'grid grid-cols-2 gap-2 sm:gap-2.5'
                                        : (previewDevice === 'tablet' || previewDevice === 'desktop') && watched.menuStyle === 'ELEGANT'
                                            ? 'grid grid-cols-2 lg:grid-cols-3 gap-3'
                                            : 'flex flex-col gap-2'
                                )}>
                                    {menuItems.length > 0 ? menuItems.map((item, i) => {
                                        const name = getTranslation(item.translations, i18n.language);
                                        const desc = getTranslation(item.translations, i18n.language, 'description');
                                        const price = formatCurrency(item.price, item.currency);
                                        const imgNode = item.imageUrl ? (
                                            <img src={item.imageUrl} alt={name} className="object-cover w-full h-full" />
                                        ) : (
                                            <div
                                                className="w-full h-full transition-all duration-500"
                                                style={{ background: `linear-gradient(135deg, ${watched.primaryColor}33, ${watched.accentColor}33)` }}
                                            />
                                        );

                                        if (watched.menuStyle === 'CLASSIC') {
                                            return (
                                                <div
                                                    key={item.id ?? i}
                                                    className="flex flex-col items-stretch text-left rounded-xl border overflow-hidden shadow-2xs transition-all duration-300"
                                                    style={{ borderColor: cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }}
                                                >
                                                    <div className="w-full aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0">
                                                        {imgNode}
                                                    </div>
                                                    <div className="p-2 flex flex-col flex-1 min-w-0">
                                                        <p className="text-[11px] sm:text-[12px] font-bold truncate leading-tight">{name}</p>
                                                        <p className="text-[9px] sm:text-[10px] opacity-60 truncate mt-0.5">{desc || t('customize.prepared_fresh_daily')}</p>
                                                        <div className="mt-auto pt-1 flex items-center justify-between">
                                                            <span className="text-[11px] sm:text-[12px] font-black transition-colors duration-500" style={{ color: watched.accentColor }}>{price}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (watched.menuStyle === 'MODERN') {
                                            return (
                                                <div
                                                    key={item.id ?? i}
                                                    className="flex flex-col items-center text-center p-2 rounded-xl border shadow-2xs transition-all duration-300"
                                                    style={{ borderColor: cardBorder, backgroundColor: cardBg }}
                                                >
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 mt-0.5">
                                                        {imgNode}
                                                    </div>
                                                    <div className="w-full mt-1.5 flex flex-col flex-1 min-w-0">
                                                        <p className="text-[11px] sm:text-[12px] font-bold truncate leading-tight w-full">{name}</p>
                                                        <p className="text-[9px] sm:text-[10px] opacity-60 truncate mt-0.5 w-full">{desc || t('customize.prepared_fresh_daily')}</p>
                                                        <div className="mt-auto pt-1 flex items-center justify-center">
                                                            <span className="text-[11px] sm:text-[12px] font-black transition-colors duration-500" style={{ color: watched.accentColor }}>{price}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (watched.menuStyle === 'ELEGANT') {
                                            return (
                                                <div key={item.id ?? i} className="flex flex-col gap-2 pb-3 mb-1 border-b transition-all duration-300" style={{ borderColor: cardBorder, backgroundColor: 'transparent' }}>
                                                    <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden shadow-sm">{imgNode}</div>
                                                    <div className="flex justify-between items-start gap-2 pt-1" style={{ fontFamily: 'Georgia, serif' }}>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] sm:text-[14px] font-bold truncate tracking-wide">{name}</p>
                                                            <p className="text-[10px] sm:text-[11px] opacity-70 line-clamp-2 mt-0.5 leading-relaxed" style={{ fontFamily: watched.fontFamily }}>{desc || t('customize.prepared_fresh_daily')}</p>
                                                        </div>
                                                        <span className="text-[13px] sm:text-[14px] font-bold flex-shrink-0 transition-colors duration-500" style={{ color: watched.accentColor }}>{price}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (watched.menuStyle === 'MINIMAL') {
                                            return (
                                                <div key={item.id ?? i} className="flex justify-between items-center py-2.5 border-b transition-all duration-300" style={{ borderColor: cardBorder, backgroundColor: 'transparent' }}>
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-[12px] sm:text-[13px] font-medium truncate">{name}</p>
                                                        <p className="text-[10px] sm:text-[11px] opacity-50 truncate mt-0.5">{desc || t('customize.prepared_fresh_daily')}</p>
                                                    </div>
                                                    <span className="text-[12px] sm:text-[13px] font-medium flex-shrink-0 transition-colors duration-500" style={{ color: watched.accentColor }}>{price}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }) : (
                                        <div className="text-center py-8 opacity-50">
                                            <p className="text-2xl mb-2">🍽️</p>
                                            <p className="text-[11px] font-semibold">{t('customize.preview_empty')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default CustomizePage;
