import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    UtensilsCrossed, List, QrCode, ExternalLink, Plus,
    CheckCircle2, Circle, TrendingUp, Zap, BarChart3, ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurantStats } from '../../hooks/useRestaurant';
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
    const { user, restaurant } = useAuth();
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
            const name = getTranslation(cat.translations || [], i18n.language) || '—';
            return { name, count };
        })
        : [];
    const maxBar = Math.max(...catBars.map(b => b.count), 1);

    const quickActions = [
        { to: '/dashboard/menu?action=add', icon: Plus, bg: 'bg-orange-50/80 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400', labelKey: 'quick.add_item', subKey: 'quick.new_item_desc' },
        { to: '/dashboard/menu', icon: UtensilsCrossed, bg: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400', labelKey: 'quick.menu', subKey: 'quick.manage_items' },
        { to: '/dashboard/categories', icon: List, bg: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400', labelKey: 'quick.categories', subKey: 'quick.organize' },
        { to: '/dashboard/qr', icon: QrCode, bg: 'bg-rose-50/80 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400', labelKey: 'quick.qr_code', subKey: 'quick.download' },
    ];

    return (
        <>
            <Helmet><title>{t('dashboard.overview')} — QR Menu</title></Helmet>

            {/* ── Page background ── */}
            <div className="min-h-full bg-neutral-50/50 dark:bg-transparent p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 space-y-8 transition-colors duration-200">

                {/* ── Welcome header ── */}
                <div className="animate-fade-in-up delay-0">
                    <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight leading-tight">
                        {t('dashboard.welcome')}, {user?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-[15px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">{restaurant?.name}</p>
                </div>

                {/* ── Hero Status Card ── */}
                <div className={cn(
                    'animate-fade-in-up delay-75 relative overflow-hidden rounded-2xl p-6 sm:p-8',
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-6 border',
                    isPublished
                        ? 'bg-[color:var(--color-brand-50)] dark:bg-neutral-900 border-[color:var(--color-brand-200)] dark:border-neutral-800'
                        : 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
                )}>
                    {/* Left content */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-2">
                            {isPublished ? (
                                <span className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[color:var(--color-brand-700)] dark:text-neutral-100 text-[11px] font-bold tracking-widest uppercase border border-[color:var(--color-brand-200)] dark:border-neutral-700 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {t('dashboard.live_badge')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-amber-700 dark:text-amber-400 text-[11px] font-bold tracking-widest uppercase border border-amber-200 dark:border-amber-500/30 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {t('dashboard.draft_badge')}
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-700 dark:text-neutral-300 text-[15px] font-medium max-w-sm leading-relaxed">
                            {isPublished
                                ? t('dashboard.live_desc')
                                : t('dashboard.draft_desc')}
                        </p>
                    </div>

                    {/* Right buttons */}
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                        <a href={`/r/${restaurant?.slug}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto bg-white/80 hover:bg-white dark:bg-neutral-900 hover:dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200" icon={<ExternalLink className="w-4 h-4" />}>
                                {t('nav.viewMenu')}
                            </Button>
                        </a>
                        {!isPublished && (
                            <Link to="/dashboard/restaurant" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 hover:dark:bg-white" icon={<Zap className="w-4 h-4" />}>
                                    {t('dashboard.publish_now')}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── 3 Stat Cards ── */}
                <div className="animate-fade-in-up delay-150 grid grid-cols-1 sm:grid-cols-3 gap-5">
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

                    {/* QR / Status card */}
                    <div className="group relative bg-white dark:bg-neutral-900 rounded-[18px] p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                                <QrCode className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <span className={cn(
                                'flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border',
                                isPublished ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                            )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', isPublished ? 'bg-emerald-500' : 'bg-amber-500')} />
                                {isPublished ? t('dashboard.status_published') : t('dashboard.status_draft')}
                            </span>
                        </div>
                        <p className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">{t('dashboard.menu_status_label')}</p>
                        <p className={cn('text-2xl font-extrabold tracking-tight', isPublished ? 'text-neutral-900 dark:text-white' : 'text-neutral-900 dark:text-white')}>
                            {isPublished ? t('dashboard.status_live') : t('status.draft')}
                        </p>
                        <p className="text-[12px] text-neutral-500 font-medium mt-1 leading-snug max-w-[90%]">
                            {isPublished ? t('dashboard.accessible_desc') : t('dashboard.not_accessible_desc')}
                        </p>
                    </div>
                </div>

                {/* ── {t('dashboard.quick_actions')} + Onboarding ── */}
                <div className="animate-fade-in-up delay-225 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* {t('dashboard.quick_actions')} */}
                    <div className="lg:col-span-8">
                        <h3 className="text-[12px] font-bold text-neutral-400 tracking-widest uppercase mb-4 ml-1 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> {t('dashboard.quick_actions')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {quickActions.map((item, i) => (
                                <Link
                                    key={t(item.labelKey)}
                                    to={item.to}
                                    style={{ animationDelay: `${i * 60 + 225}ms` }}
                                    className="animate-fade-in-up group relative p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:-translate-y-2 hover:shadow-xl hover:border-neutral-200 dark:hover:border-neutral-700 active:scale-[0.97] transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    <div className={cn(
                                        'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105',
                                        item.bg
                                    )}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[14px] font-bold text-neutral-900 dark:text-neutral-50 leading-tight mb-0.5">{t(item.labelKey)}</span>
                                    <span className="text-[12px] text-neutral-500 dark:text-neutral-400">{t(item.subKey)}</span>
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
