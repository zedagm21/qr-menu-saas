import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    UtensilsCrossed, List, QrCode, Plus,
    CheckCircle2, Circle, TrendingUp, BarChart3, ArrowUpRight, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant, useRestaurantStats } from '../../hooks/useRestaurant';
import { useCategories } from '../../hooks/useCategories';
import { useMenuItems } from '../../hooks/useMenuItems';
import { Button } from '../../components/ui/Button';
import { getTranslation, cn } from '../../lib/utils';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, enabled = true) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || target === 0) { setValue(target); return; }
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [target, duration, enabled]);

    return value;
}

export default function OverviewPage() {
    const { t, i18n } = useTranslation();
    const { user, restaurant: authRestaurant } = useAuth();
    const { data: liveRestaurant } = useRestaurant();
    const restaurant = liveRestaurant || authRestaurant;

    const { data: stats, isLoading: statsLoading } = useRestaurantStats();
    const { data: categories } = useCategories();
    const { data: menuItems, isLoading: itemsLoading } = useMenuItems();

    const catCount = Array.isArray(categories) ? categories.length : 0;
    const itemCount = Array.isArray(menuItems) ? menuItems.length : 0;
    const availableItems = Array.isArray(menuItems) ? menuItems.filter(i => i.isAvailable).length : 0;
    const isPublished = restaurant?.status === 'PUBLISHED';

    // Animated counter targets
    const displayItems = stats?.itemCount ?? itemCount;
    const displayCats = stats?.categoryCount ?? catCount;
    const animItems = useCountUp(displayItems, 900, !statsLoading);
    const animCats = useCountUp(displayCats, 900, !statsLoading);
    const animAvail = useCountUp(availableItems, 800, !itemsLoading);

    const onboardingSteps = [
        { done: !!(restaurant?.name && restaurant?.description), label: t('dashboard.steps.profile'), to: '/dashboard/restaurant' },
        { done: catCount > 0, label: t('dashboard.steps.categories'), to: '/dashboard/categories' },
        { done: itemCount > 0, label: t('dashboard.steps.menu_items'), to: '/dashboard/menu' },
        { done: isPublished, label: t('dashboard.steps.publish'), to: '/dashboard/restaurant' },
    ];
    const doneCount = onboardingSteps.filter(s => s.done).length;
    const allDone = doneCount === onboardingSteps.length;

    // Items per category for mini bar chart
    const catBars = Array.isArray(categories)
        ? categories.slice(0, 6).map(cat => {
            const count = Array.isArray(menuItems)
                ? menuItems.filter(i => i.categoryId === cat.id).length
                : 0;
            return {
                name: getTranslation(cat.translations, i18n.language.toUpperCase()) || 'Category',
                count,
            };
        })
        : [];
    const maxBar = Math.max(...catBars.map(c => c.count), 1);

    const quickActions = [
        { to: '/dashboard/menu?action=add', icon: Plus, bg: 'bg-orange-50/80 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', labelKey: 'quick.add_item', subKey: 'quick.new_item_desc' },
        { to: '/dashboard/menu', icon: UtensilsCrossed, bg: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', labelKey: 'quick.menu', subKey: 'quick.manage_items' },
        { to: '/dashboard/categories', icon: List, bg: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', labelKey: 'quick.categories', subKey: 'quick.organize' },
        { to: '/dashboard/qr', icon: QrCode, bg: 'bg-rose-50/80 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', labelKey: 'quick.qr_code', subKey: 'quick.download' },
    ];

    return (
        <>
            <Helmet><title>Dashboard — OurMenu</title></Helmet>

            <div className="min-h-full bg-neutral-50/50 dark:bg-transparent px-3.5 py-3 sm:p-6 lg:p-8 pb-24 lg:pb-12 space-y-3.5 sm:space-y-6 transition-colors duration-200">

                {/* ── Restaurant Overview Header (Desktop only) ── */}
                <div className="hidden sm:block animate-fade-in-up delay-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
                        {restaurant?.name || t('nav.overview', { defaultValue: 'Overview' })}
                    </h1>
                    <p className="text-[14px] font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {t('dashboard.operations_subtitle', { defaultValue: 'Digital menu & operations overview' })}
                    </p>
                </div>

                {/* ── Menu Status & Preview Banner (Live / Draft status + Preview link) ── */}
                <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3 animate-fade-in-up">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                            'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0',
                            isPublished ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        )}>
                            {isPublished ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Circle className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={cn('w-2 h-2 rounded-full', isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500')} />
                                <h2 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white truncate">
                                    {isPublished ? t('dashboard.menu_live_title', { defaultValue: 'Your Menu is Live' }) : t('status.draft', { defaultValue: 'Draft Mode' })}
                                </h2>
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {isPublished
                                    ? t('dashboard.accessible_desc', { defaultValue: 'Customers can scan and view your menu' })
                                    : t('dashboard.not_accessible_desc', { defaultValue: 'Only you can see the menu until published' })}
                            </p>
                        </div>
                    </div>

                    {/* Live Menu Preview Button */}
                    {restaurant?.slug && (
                        <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-[color:var(--color-brand-50)] hover:bg-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/15 dark:hover:bg-[color:var(--color-brand-500)]/25 text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-300)] border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                            <span>{t('nav.preview', { defaultValue: 'Live Menu' })}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </a>
                    )}
                </div>

                {/* ── Mobile 2-Column Metric Strip (< sm) ── */}
                <div className="sm:hidden grid grid-cols-2 divide-x divide-neutral-200/70 dark:divide-neutral-800/80 bg-white/95 dark:bg-neutral-900/95 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/90 p-3 shadow-xs animate-fade-in-up">
                    <Link to="/dashboard/menu" className="flex flex-col items-center justify-center text-center px-2 active:scale-95 transition-transform">
                        <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5 truncate w-full">
                            {t('dashboard.total_items')}
                        </span>
                        <span className="text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {statsLoading ? '—' : animItems}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                            {animAvail} {t('dashboard.active')}
                        </span>
                    </Link>

                    <Link to="/dashboard/categories" className="flex flex-col items-center justify-center text-center px-2 active:scale-95 transition-transform">
                        <span className="text-[10px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5 truncate w-full">
                            {t('dashboard.total_categories')}
                        </span>
                        <span className="text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {statsLoading ? '—' : animCats}
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                            {t('dashboard.organized')}
                        </span>
                    </Link>
                </div>

                {/* ── Desktop 2 Stat Cards (sm:) ── */}
                <div className="hidden sm:grid animate-fade-in-up delay-150 grid-cols-2 gap-5">
                    {/* Items card */}
                    <div className="group relative bg-white dark:bg-neutral-900 rounded-[18px] p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                                <TrendingUp className="w-3 h-3" />
                                {t('dashboard.active')}
                            </span>
                        </div>
                        <p className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">{t('dashboard.total_items')}</p>
                        <p className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{statsLoading ? '—' : animItems}</p>
                        {itemCount > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between text-[11px] text-neutral-500 font-medium mb-1.5">
                                    <span>{itemsLoading ? '…' : animAvail} {t('dashboard.available')}</span>
                                    <span>{Math.round((availableItems / itemCount) * 100)}%</span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full rounded-full bg-[color:var(--color-brand-400)] transition-all duration-700"
                                        style={{ width: `${(availableItems / itemCount) * 100}%` }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Categories card */}
                    <div className="group relative bg-white dark:bg-neutral-900 rounded-[18px] p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <List className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                                <ArrowUpRight className="w-3 h-3" />
                                {t('dashboard.organized')}
                            </span>
                        </div>
                        <p className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">{t('dashboard.total_categories')}</p>
                        <p className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{statsLoading ? '—' : animCats}</p>

                        {/* Mini bar chart */}
                        {catBars.length > 0 && (
                            <div className="mt-4 flex items-end gap-1 h-8">
                                {catBars.map((bar, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar" title={`${bar.name}: ${bar.count} items`}>
                                        <div
                                            className="w-full rounded-t-sm bg-indigo-300 dark:bg-indigo-500/50 opacity-70 group-hover/bar:opacity-100 transition-all duration-300"
                                            style={{ height: `${(bar.count / maxBar) * 100}%`, minHeight: bar.count > 0 ? 4 : 2 }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick Actions + Onboarding ── */}
                <div className="animate-fade-in-up delay-225 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

                    {/* Quick Actions */}
                    <div className="lg:col-span-8">
                        <h3 className="text-[11px] sm:text-[12px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest uppercase mb-2.5 sm:mb-4 ml-1 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-[color:var(--color-brand-500)]" /> {t('dashboard.quick_actions')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                            {quickActions.map((item, i) => (
                                <Link
                                    key={t(item.labelKey)}
                                    to={item.to}
                                    style={{ animationDelay: `${i * 60 + 225}ms` }}
                                    className="animate-fade-in-up group relative p-3.5 sm:p-5 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-2xl sm:rounded-[20px] shadow-xs hover:-translate-y-1 hover:shadow-md active:scale-[0.97] transition-all duration-200 flex flex-col overflow-hidden"
                                >
                                    <div className={cn(
                                        'w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-transform duration-200 group-hover:scale-105',
                                        item.bg
                                    )}>
                                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[13px] sm:text-[14px] font-bold text-neutral-900 dark:text-neutral-50 leading-tight mb-0.5 truncate">{t(item.labelKey)}</span>
                                    <span className="text-[11px] sm:text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-1">{t(item.subKey)}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Onboarding / Stats side */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Onboarding checklist */}
                        {!allDone && (
                            <div className="bg-white dark:bg-neutral-900 rounded-[18px] border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50">{t('dashboard.onboarding_title')}</h3>
                                    <span className="text-[12px] font-bold text-neutral-400">{doneCount}/{onboardingSteps.length}</span>
                                </div>
                                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mb-4 overflow-hidden">
                                    <div className="bg-gradient-to-r from-[color:var(--color-brand-500)] to-[color:var(--color-accent-500)] h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${(doneCount / onboardingSteps.length) * 100}%` }} />
                                </div>
                                <div className="space-y-1">
                                    {onboardingSteps.map((step, i) => (
                                        <Link key={i} to={step.to}
                                            className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors group">
                                            {step.done
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                : <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-[color:var(--color-brand-500)] shrink-0 transition-colors" />
                                            }
                                            <span className={cn('text-[13px] flex-1', step.done ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-neutral-800 dark:text-neutral-200 font-bold')}>
                                                {step.label}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bar chart legend (if categories exist) */}
                        {catBars.length > 0 && (
                            <div className="bg-white dark:bg-neutral-900 rounded-[18px] border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                                <h3 className="text-[12px] font-bold text-neutral-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-3.5 h-3.5" /> {t('overview.items_by_category', { defaultValue: 'Items by Category' })}
                                </h3>
                                <div className="space-y-2.5">
                                    {catBars.map((bar, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-[12px] mb-1">
                                                <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[70%]">{bar.name}</span>
                                                <span className="font-black text-neutral-500">{bar.count}</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-all duration-700"
                                                    style={{ width: `${(bar.count / maxBar) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}
