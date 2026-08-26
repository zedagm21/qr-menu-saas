import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
    Search,
    X,
    Flame,
    UtensilsCrossed,
    Star,
    SlidersHorizontal
} from 'lucide-react';
import { publicApi } from '../../services/api';
import { formatCurrency, applyRestaurantTheme, getTranslation, isFastingItem, cn } from '../../lib/utils';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { FoodDetail } from '../../components/public/FoodDetail';
import { MenuFilterModal, type FilterState } from '../../components/public/MenuFilterModal';
import { RestaurantInfoModal } from '../../components/public/RestaurantInfoModal';
import type { Restaurant, PublicCategory, PublicMenuItem } from '../../types';

export default function PublicMenuPage() {
    const { t, i18n } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const [lang, setLang] = useState<'EN' | 'AM'>(() => {
        const current = i18n.language?.toUpperCase();
        return current === 'AM' ? 'AM' : 'EN';
    });
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        minPrice: '',
        maxPrice: '',
        fasting: 'all',
    });
    const [isDark, setIsDark] = useState<boolean>(() => {
        const stored = localStorage.getItem('public-theme');
        if (stored === 'dark') return true;
        if (stored === 'light') return false;
        // Default for visitor is device Auto
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const handleLanguageToggle = () => {
        const nextLang = lang === 'EN' ? 'AM' : 'EN';
        setLang(nextLang);
        i18n.changeLanguage(nextLang.toLowerCase());
        localStorage.setItem('ui-language', nextLang.toLowerCase());
    };

    const { data: restaurant, isLoading: restaurantLoading, isError } = useQuery<Restaurant>({
        queryKey: ['public-restaurant', slug, lang],
        queryFn: () => publicApi.getRestaurant(slug!, lang),
        enabled: !!slug,
        staleTime: 60_000,
        retry: false,
    });

    const { data: categories = [], isLoading: menuLoading } = useQuery<PublicCategory[]>({
        queryKey: ['public-menu', slug, lang],
        queryFn: () => publicApi.getMenu(slug!, lang),
        enabled: !!slug && !!restaurant,
        staleTime: 30_000,
        retry: false,
    });

    // When restaurant theme data loads, if visitor has NOT explicitly saved a theme in localStorage:
    // check if restaurant configured a forced theme (DARK / LIGHT), else stay with device Auto
    useEffect(() => {
        const stored = localStorage.getItem('public-theme');
        if (!stored && restaurant?.theme?.darkMode) {
            if (restaurant.theme.darkMode === 'DARK') {
                setIsDark(true);
            } else if (restaurant.theme.darkMode === 'LIGHT') {
                setIsDark(false);
            } else {
                // AUTO: follow device
                setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
            }
        }
    }, [restaurant?.theme?.darkMode]);

    // Apply dark class and color-scheme to document root
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
    }, [isDark]);

    // Listen to device system theme changes if visitor hasn't set an explicit localStorage override
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem('public-theme');
            if (!stored) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleSystemChange);
        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, []);

    const toggleDarkMode = () => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('public-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    useEffect(() => {
        if (restaurant?.theme) {
            applyRestaurantTheme(restaurant.theme.primaryColor, restaurant.theme.accentColor);
        }
    }, [restaurant]);

    useEffect(() => {
        if (restaurant?.defaultLanguage && !localStorage.getItem('ui-language')) {
            const initialLang = restaurant.defaultLanguage === 'AM' ? 'AM' : 'EN';
            setLang(initialLang);
            i18n.changeLanguage(initialLang.toLowerCase());
        }
    }, [restaurant?.defaultLanguage, i18n]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.minPrice.trim() !== '' || filters.maxPrice.trim() !== '') {
            count += 1;
        }
        if (filters.fasting !== 'all') {
            count += 1;
        }
        return count;
    }, [filters]);

    const matchesItemFilters = (item: PublicMenuItem) => {
        if (!item.isAvailable) return false;

        // Search filter
        if (search) {
            const query = search.toLowerCase();
            const name = ((item as any).name ?? '').toLowerCase();
            const desc = ((item as any).description ?? '').toLowerCase();
            if (!name.includes(query) && !desc.includes(query)) return false;
        }

        // Price filter
        const effectivePrice = (item.discountPrice && parseFloat(item.discountPrice) < parseFloat(item.price))
            ? parseFloat(item.discountPrice)
            : parseFloat(item.price);

        if (filters.minPrice.trim() !== '') {
            const min = parseFloat(filters.minPrice);
            if (!isNaN(min) && effectivePrice < min) return false;
        }

        if (filters.maxPrice.trim() !== '') {
            const max = parseFloat(filters.maxPrice);
            if (!isNaN(max) && effectivePrice > max) return false;
        }

        // Fasting filter
        if (filters.fasting === 'fasting') {
            if (!isFastingItem(item)) return false;
        } else if (filters.fasting === 'non-fasting') {
            if (isFastingItem(item)) return false;
        }

        return true;
    };

    const featuredItems = useMemo(() => {
        return categories
            .flatMap(c => c.menuItems)
            .filter(item => item.isFeatured && matchesItemFilters(item));
    }, [categories, search, filters]);

    const filteredCategories = useMemo(() => {
        return categories
            .map(cat => ({
                ...cat,
                menuItems: cat.menuItems.filter(matchesItemFilters),
            }))
            .filter(cat => activeCategory ? cat.id === activeCategory : true)
            .filter(cat => cat.menuItems.length > 0 || (!search && activeFilterCount === 0));
    }, [categories, search, activeCategory, filters, activeFilterCount]);

    const menuStyle = restaurant?.theme?.menuStyle || 'MODERN';

    if (restaurantLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#111111]">
            <div className="w-10 h-10 border-4 border-[color:var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isError || !restaurant) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#111111] text-center px-4">
            <div className="w-16 h-16 bg-white dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-[#2A2A2A]">
                <span className="text-3xl">🍽️</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-[#F5F5F5] tracking-tight">{t("public.menu_not_found")}</h1>
            <p className="text-neutral-500 dark:text-[#A3A3A3] mt-2 font-medium">{t("public.menu_unavailable_desc")}</p>
        </div>
    );

    const fontFamily = restaurant.theme?.fontFamily ?? 'Inter';
    const isSerif = fontFamily === 'Playfair Display' || fontFamily === 'Georgia';
    const fontStack = isSerif
        ? `'${fontFamily}', 'Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'Nyala', serif`
        : `'${fontFamily}', 'Noto Sans Ethiopic', 'Nyala', 'Abyssinica SIL', sans-serif`;

    return (
        <ThemeProvider theme={restaurant.theme}>
            <Helmet>
                <title>{restaurant.name} — {t("public.menu_label")}</title>
                <style>{`body { font-family: ${fontStack}; }`}</style>
            </Helmet>

            <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#111111] transition-colors" dir="ltr">

                {/* ─── Sticky Top Bar ─── */}
                <div className="sticky top-0 z-50 bg-neutral-900/40 dark:bg-neutral-950/50 backdrop-blur-md border-b border-white/10 dark:border-neutral-800/50 h-14 px-4 flex items-center justify-between">
                    {/* Left side: Logo + MENU text (Clickable -> Opens Restaurant Info Modal) */}
                    <button
                        type="button"
                        onClick={() => setShowRestaurantInfo(true)}
                        aria-label={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                        className="flex items-center gap-2.5 p-1 -ml-1 rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer group"
                    >
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="Logo" className="w-8 h-8 rounded-full border border-white/30 shadow-sm object-cover group-hover:border-white transition-colors" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/90 font-bold text-sm group-hover:bg-white/30 transition-colors">
                                {restaurant.name?.[0] || '🍽️'}
                            </div>
                        )}
                        <span className="text-white/90 group-hover:text-white font-bold text-sm tracking-[0.2em] uppercase transition-colors">{t("public.menu_label")}</span>
                    </button>

                    {/* Right side: Language + Theme Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleLanguageToggle}
                            aria-label={t("public.language_switch")}
                            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-xs font-bold"
                        >
                            {lang === 'EN' ? 'አማ' : 'EN'}
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white/80"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                {/* ─── Hero Section ─── */}
                <header className="relative aspect-[21/9] sm:aspect-[3/1] animate-fade-in-up delay-0 overflow-hidden">
                    {/* Cover image as background */}
                    {restaurant.coverImageUrl ? (
                        <div className="absolute inset-0">
                            <img src={restaurant.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-neutral-800 dark:bg-[#1A1A1A]">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                        </div>
                    )}

                    {/* Content overlays the image */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20">
                        <h1 className={cn("text-2xl sm:text-3xl font-black text-white", lang === 'AM' && 'font-ethiopic')}>
                            {restaurant.name}
                        </h1>
                        {restaurant.description && (
                            <p className={cn("text-white/80 text-sm sm:text-base max-w-md mx-auto mt-1", lang === 'AM' && 'font-ethiopic')}>
                                {restaurant.description}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-4 text-white/70 text-xs sm:text-sm mt-3">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {t("public.open_now")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                📍 {lang === 'AM'
                                    ? [restaurant.city, restaurant.country === 'Ethiopia' ? 'ኢትዮጵያ' : restaurant.country].filter(Boolean).join('፣ ') || 'ኢትዮጵያ'
                                    : [restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ethiopia'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* ─── Sticky Navigation ─── */}
                <div className="sticky top-14 z-30 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-black/5 dark:border-[#2A2A2A] shadow-sm py-2">
                    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t("public.search_placeholder")}
                                    className={cn(
                                        "w-full h-10 pl-10 pr-10 rounded-xl bg-neutral-100/80 dark:bg-[#111111] border-none text-[14px] font-medium focus:ring-1 focus:ring-[color:var(--color-brand-500)] text-neutral-900 dark:text-[#F5F5F5] placeholder:text-neutral-400 dark:placeholder:text-[#A3A3A3] transition-all",
                                        lang === 'AM' && 'font-ethiopic'
                                    )}
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        aria-label={t("public.clear_search")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5F5F5] bg-white dark:bg-[#222222] rounded-lg shadow-sm border border-neutral-200 dark:border-[#2A2A2A]"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(true)}
                                aria-label={t('filters.title')}
                                className={cn(
                                    "h-10 px-3 sm:px-3.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all duration-200 shrink-0 border cursor-pointer select-none",
                                    activeFilterCount > 0
                                        ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-sm hover:brightness-105"
                                        : "bg-neutral-100/80 dark:bg-[#111111] text-neutral-700 dark:text-[#E5E5E5] border-transparent hover:bg-neutral-200/80 dark:hover:bg-[#222222]",
                                    lang === 'AM' && 'font-ethiopic'
                                )}
                            >
                                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                                <span className="hidden xs:inline sm:inline">
                                    {activeFilterCount > 0
                                        ? t('filters.button_active', { count: activeFilterCount })
                                        : t('filters.button')}
                                </span>
                                {activeFilterCount > 0 && (
                                    <span className="xs:hidden sm:hidden w-5 h-5 rounded-full bg-white text-[color:var(--color-brand-500)] text-[10px] font-black flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {categories.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-2 px-2">
                                <button
                                    onClick={() => setActiveCategory(null)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 border",
                                        !activeCategory
                                            ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-sm"
                                            : "bg-white dark:bg-[#222222] text-neutral-600 dark:text-[#A3A3A3] border-neutral-200 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A]",
                                        lang === 'AM' && 'font-ethiopic'
                                    )}
                                >
                                    {t("public.all_items")}
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 border",
                                            activeCategory === cat.id
                                                ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-sm"
                                                : "bg-white dark:bg-[#222222] text-neutral-600 dark:text-[#A3A3A3] border-neutral-200 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A]",
                                            lang === 'AM' && 'font-ethiopic'
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Main Menu Grid ─── */}
                <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 pt-6 pb-20">
                    {menuLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-8 h-8 border-4 border-[color:var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* ─── Featured Items Showcase (Top Section) ─── */}
                            {!search && !activeCategory && featuredItems.length > 0 && (
                                <section className="scroll-mt-32 pb-2">
                                    <div className="mb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-amber-500/20 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                            </div>
                                            <h2 className={cn("text-xl sm:text-2xl font-black text-neutral-900 dark:text-[#F5F5F5] tracking-tight", lang === 'AM' && 'font-ethiopic font-bold')}>
                                                {t('public.featured_specials', { defaultValue: '⭐ Featured Specials' })}
                                            </h2>
                                        </div>
                                        <p className={cn("text-xs sm:text-sm text-neutral-500 dark:text-[#A3A3A3] font-medium sm:text-right", lang === 'AM' && 'font-ethiopic')}>
                                            {t('public.featured_subtitle', { defaultValue: 'Handpicked favorites and recommendations' })}
                                        </p>
                                    </div>

                                    {/* Responsive Showcase Grid */}
                                    <div className={cn(
                                        "grid",
                                        (menuStyle === 'MODERN' || menuStyle === 'CLASSIC') && "grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5",
                                        menuStyle === 'ELEGANT' && "grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
                                        menuStyle === 'MINIMAL' && "grid-cols-1 gap-3 sm:gap-4"
                                    )}>
                                        {featuredItems.map((item, idx) => (
                                            <div
                                                key={`featured-${item.id}`}
                                                className="animate-fade-in-up h-full"
                                                style={{ animationDelay: `${Math.min(idx * 60 + 80, 400)}ms` }}
                                            >
                                                <MenuItemCard
                                                    item={item}
                                                    lang={lang}
                                                    onClick={() => setSelectedItem(item)}
                                                    menuStyle={menuStyle}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ─── Regular Category Sections ─── */}
                            {filteredCategories.map(cat => (
                                <div key={cat.id} className="scroll-mt-32">
                                    <div className={cn("mb-4 flex items-baseline gap-3", menuStyle === 'MINIMAL' && "mb-2")}>
                                        <h2 className={cn("text-xl font-black text-neutral-900 dark:text-[#F5F5F5] tracking-tight", lang === 'AM' && 'font-ethiopic font-bold')}>
                                            {cat.name}
                                        </h2>
                                        <div className="flex-grow border-t border-neutral-200 dark:border-[#2A2A2A]" />
                                    </div>

                                    {/* DYNAMIC GRID LAYOUT */}
                                    <div className={cn(
                                        "grid",
                                        (menuStyle === 'MODERN' || menuStyle === 'CLASSIC') && "grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5",
                                        menuStyle === 'ELEGANT' && "grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6",
                                        menuStyle === 'MINIMAL' && "grid-cols-1 gap-3 sm:gap-4"
                                    )}>
                                        {cat.menuItems.map((item: PublicMenuItem, idx: number) => (
                                            <div
                                                key={item.id}
                                                className="animate-fade-in-up h-full"
                                                style={{ animationDelay: `${Math.min(idx * 50 + 100, 500)}ms` }}
                                            >
                                                <MenuItemCard
                                                    item={item}
                                                    lang={lang}
                                                    onClick={() => setSelectedItem(item)}
                                                    menuStyle={menuStyle}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="text-center py-20 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-black/5 dark:border-[#2A2A2A] shadow-sm">
                                    <p className="text-3xl mb-2">🍽️</p>
                                    <p className={cn("text-neutral-900 dark:text-[#F5F5F5] font-bold text-base mb-1", lang === 'AM' && 'font-ethiopic')}>
                                        {activeFilterCount > 0 && !search
                                            ? t("filters.no_filtered_items")
                                            : t("public.no_items_found")}
                                    </p>
                                    <p className={cn("text-neutral-500 dark:text-[#A3A3A3] text-[13px]", lang === 'AM' && 'font-ethiopic')}>
                                        {t("public.no_search_results_desc")}
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                                        {search && (
                                            <button
                                                onClick={() => setSearch('')}
                                                className={cn("px-4 py-2 rounded-lg bg-neutral-100 dark:bg-[#222222] hover:bg-neutral-200 dark:hover:bg-[#2A2A2A] text-neutral-700 dark:text-[#F5F5F5] font-bold text-xs transition-colors cursor-pointer", lang === 'AM' && 'font-ethiopic')}
                                            >
                                                {t("public.clear_search")}
                                            </button>
                                        )}
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={() => setFilters({ minPrice: '', maxPrice: '', fasting: 'all' })}
                                                className={cn("px-4 py-2 rounded-lg bg-[color:var(--color-brand-500)] hover:brightness-110 text-white font-bold text-xs transition-all shadow-xs cursor-pointer", lang === 'AM' && 'font-ethiopic')}
                                            >
                                                {t("filters.reset_filters")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="py-8 text-center bg-white dark:bg-[#0C0C0C] border-t border-black/5 dark:border-[#2A2A2A] mt-auto">
                    <p className={cn("text-[11px] font-bold tracking-widest uppercase text-neutral-400 dark:text-[#A3A3A3]", lang === 'AM' && 'font-ethiopic normal-case')}>
                        {t("public.powered_by")}
                    </p>
                </footer>

                {/* ─── Full Page Detail Overlay ─── */}
                <FoodDetail
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    isAm={lang === 'AM'}
                />

                {/* ─── Menu Filters Modal / Bottom-Sheet ─── */}
                <MenuFilterModal
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    currentFilters={filters}
                    onApply={(newFilters) => setFilters(newFilters)}
                    currencyCode={t('currency.code', { defaultValue: 'ETB' })}
                    isAm={lang === 'AM'}
                />

                {/* ─── Restaurant Info Modal / Bottom-Sheet (About Restaurant) ─── */}
                <RestaurantInfoModal
                    isOpen={showRestaurantInfo}
                    onClose={() => setShowRestaurantInfo(false)}
                    restaurant={restaurant}
                    isAm={lang === 'AM'}
                />
            </div>
        </ThemeProvider>
    );
}

// ─── Menu Item Card Component (4 Styles Differentiated) ───
const MenuItemCard = ({ item, lang, onClick, menuStyle }: { item: any, lang: string, onClick: () => void, menuStyle: string }) => {
    const { t } = useTranslation();
    const name = item.translations?.length ? getTranslation(item.translations, lang) : item.name ?? '';
    const desc = item.translations?.length ? getTranslation(item.translations, lang, 'description') : item.description ?? '';
    const isAm = lang === 'AM';
    const hasImage = !!item.imageUrl;

    const hasDiscount = item.discountPrice && parseFloat(item.discountPrice) < parseFloat(item.price);
    const regularPriceFormatted = formatCurrency(item.price, item.currency);
    const discountPriceFormatted = hasDiscount ? formatCurrency(item.discountPrice, item.currency) : '';
    const discountPercent = hasDiscount ? Math.round(((parseFloat(item.price) - parseFloat(item.discountPrice)) / parseFloat(item.price)) * 100) : 0;

    /* ── MINIMAL STYLE ── */
    if (menuStyle === 'MINIMAL') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full flex flex-row items-stretch text-left bg-white dark:bg-neutral-900/95 rounded-2xl group transition-all duration-300",
                    "border shadow-sm hover:shadow-md hover:-translate-y-0.5",
                    item.isFeatured
                        ? "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-50/15 dark:bg-amber-950/10"
                        : "border-neutral-200/80 dark:border-neutral-800/80",
                    "overflow-hidden min-h-[140px]",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {/* Image Section (Left, Half Width, Full Height) */}
                <div className="w-1/2 flex-[0_0_50%] h-auto relative overflow-hidden shrink-0">
                    {hasImage ? (
                        <img
                            src={item.imageUrl}
                            alt={name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 border-r border-black/5 dark:border-white/5 flex flex-col items-center justify-center">
                            <span className="text-4xl mb-1 filter drop-shadow-sm">🍽️</span>
                        </div>
                    )}
                </div>

                {/* Text Section (Right, Remaining Width) */}
                <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        {item.isFeatured && (
                            <span className={cn("bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider shrink-0 flex items-center gap-1", isAm && 'font-ethiopic')}>
                                <Star className="w-2.5 h-2.5 fill-white text-white" /> {t('public.featured')}
                            </span>
                        )}
                        {hasDiscount && (
                            <span className={cn("bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm", isAm && 'font-ethiopic')}>
                                <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                            </span>
                        )}
                        {item.isSpicy && <span title={t('public.spicy')} className="bg-red-500 text-white px-1.5 py-0.5 rounded-sm shrink-0 flex items-center justify-center"><Flame className="w-2.5 h-2.5" /></span>}
                    </div>

                    <h3 className={cn("text-base sm:text-lg font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight mb-1 truncate w-full", isAm && 'font-ethiopic')}>
                        {name}
                    </h3>

                    {desc && (
                        <p className={cn("text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3 leading-snug w-full", isAm && "font-ethiopic")}>
                            {desc}
                        </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-1">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-xs sm:text-sm font-bold line-through text-neutral-400 dark:text-neutral-500 leading-none">
                                    {regularPriceFormatted}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                    -{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </span>
                            </div>
                        ) : (
                            <p className="text-lg sm:text-xl font-black text-[color:var(--color-brand-500)] leading-none">
                                {regularPriceFormatted}
                            </p>
                        )}
                        {!item.isAvailable && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                {t('public.sold_out')}
                            </span>
                        )}
                    </div>
                </div>
            </button>
        );
    }

    /* ── ELEGANT STYLE ── */
    if (menuStyle === 'ELEGANT') {
        const elegantFontClass = 'font-serif';
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full h-full text-left bg-white/90 dark:bg-neutral-900/90 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:hover:shadow-none group flex flex-col",
                    item.isFeatured
                        ? "border border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 shadow-md"
                        : "border border-black/5 dark:border-[#2A2A2A]",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {hasImage ? (
                    <div className="w-full aspect-[3/2] bg-neutral-100 dark:bg-[#111111] relative overflow-hidden shrink-0">
                        <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 dark:opacity-20 flex-none" />

                        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-12 z-10">
                            {item.isFeatured && (
                                <div className={cn("bg-amber-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <Star className="w-3 h-3 fill-white text-white" /> {t('public.featured')}
                                </div>
                            )}
                            {hasDiscount && (
                                <div className={cn("bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </div>
                            )}
                            {item.isSpicy && (
                                <div title={t('public.spicy')} className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
                                    <Flame className="w-3 h-3 fill-white text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full aspect-[3/2] bg-neutral-50 dark:bg-[#111111] shrink-0 border-b border-neutral-100 dark:border-[#2A2A2A] flex items-center justify-center relative">
                        <UtensilsCrossed className="w-8 h-8 text-neutral-300 dark:text-[#2A2A2A]" />
                        {hasDiscount && (
                            <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
                                <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                            </div>
                        )}
                    </div>
                )}

                <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    <h3 className={cn("text-lg sm:text-xl font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight mb-2 truncate", elegantFontClass, isAm && 'font-ethiopic font-bold')}>
                        {name}
                    </h3>
                    {desc && (
                        <p className={cn("text-[13px] sm:text-sm text-neutral-500 dark:text-[#A3A3A3] line-clamp-2 leading-relaxed mb-4", isAm && "font-ethiopic")}>
                            {desc}
                        </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/5 dark:border-[#2A2A2A]">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap pt-3">
                                <span className={cn("text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400", elegantFontClass)}>
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-xs sm:text-sm font-medium line-through text-neutral-400 dark:text-[#A3A3A3]">
                                    {regularPriceFormatted}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                    -{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </span>
                            </div>
                        ) : (
                            <p className={cn("text-lg sm:text-xl font-bold text-[color:var(--color-brand-500)] pt-3", elegantFontClass)}>
                                {regularPriceFormatted}
                            </p>
                        )}
                        {!item.isAvailable && (
                            <span className={cn("text-[10px] font-bold px-2 py-1 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-3", isAm && 'font-ethiopic')}>
                                {t('public.sold_out')}
                            </span>
                        )}
                    </div>
                </div>
            </button>
        );
    }

    /* ── CLASSIC STYLE ── */
    if (menuStyle === 'CLASSIC') {
        const classicFontClass = 'font-serif';
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full h-full bg-amber-50/30 dark:bg-amber-950/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-amber-900/10 transition-all duration-300",
                    item.isFeatured
                        ? "border-2 border-amber-500/50 dark:border-amber-500/40 shadow-md"
                        : "border border-amber-900/5 dark:border-amber-100/5",
                    "hover:-translate-y-1 active:scale-[0.98]",
                    "flex flex-col items-center justify-start p-4 sm:p-5 group",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {hasImage ? (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-100 dark:bg-[#111111] border border-amber-900/5 dark:border-amber-100/5 shadow-inner">
                        <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-50" />

                        {item.isFeatured && <div className={cn("absolute top-1 left-1 bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>{t('public.featured')}</div>}
                        {hasDiscount && <div className={cn("absolute bottom-1 left-1 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}</div>}
                        {item.isSpicy && <div title={t('public.spicy')} className="absolute top-1 right-1 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg"><Flame className="w-2.5 h-2.5 fill-white text-white" /></div>}
                    </div>
                ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center shadow-inner border border-amber-900/5 dark:border-amber-100/5">
                        <UtensilsCrossed className="w-8 h-8 text-amber-700/30 dark:text-amber-200/20" />
                    </div>
                )}

                <div className="flex flex-col flex-grow w-full items-center text-center mt-3 sm:mt-4">
                    <h3 className={cn("text-sm sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight truncate w-full", classicFontClass, isAm && 'font-ethiopic')}>
                        {name}
                    </h3>
                    {desc && <p className={cn("text-xs text-neutral-600 dark:text-[#A3A3A3] line-clamp-1 mt-1 w-full", isAm && "font-ethiopic")}>{desc}</p>}
                    <div className="mt-auto w-full pt-1.5 flex flex-col items-center">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap justify-center mt-1">
                                <span className={cn("text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400", classicFontClass)}>
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-xs font-medium line-through text-neutral-400 dark:text-[#A3A3A3]">
                                    {regularPriceFormatted}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                    -{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </span>
                            </div>
                        ) : (
                            <p className={cn("text-lg sm:text-xl font-bold text-[color:var(--color-brand-500)] text-center mt-1", classicFontClass)}>{regularPriceFormatted}</p>
                        )}
                        {!item.isAvailable && <span className={cn("text-[9px] font-bold px-2 py-0.5 bg-neutral-200/50 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1.5", isAm && 'font-ethiopic')}>{t('public.sold_out')}</span>}
                    </div>
                </div>
            </button>
        );
    }

    /* ── MODERN STYLE (DEFAULT) ── */
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full h-full bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-brand-500/10 transition-all duration-300",
                item.isFeatured
                    ? "border border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 shadow-md"
                    : "border border-black/5 dark:border-[#2A2A2A]",
                "hover:-translate-y-1 active:scale-[0.98]",
                "flex flex-col items-center justify-start p-5 sm:p-6 group",
                !item.isAvailable && "opacity-60 grayscale-[50%]"
            )}
        >
            {hasImage ? (
                <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-100 dark:bg-[#111111] border border-black/5 dark:border-white/5">
                    <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                    {/* Dark gradient for badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-50" />

                    {/* Badges container */}
                    {item.isFeatured && (
                        <div className={cn("absolute top-1 left-1 bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>
                            {t('public.featured')}
                        </div>
                    )}
                    {hasDiscount && (
                        <div className={cn("absolute bottom-1 left-1 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>
                            {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </div>
                    )}
                    {item.isSpicy && (
                        <div title={t('public.spicy')} className="absolute top-1 right-1 bg-red-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg">
                            <Flame className="w-2.5 h-2.5 fill-white text-white" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-50 dark:bg-[#111111] border border-neutral-200 dark:border-[#2A2A2A] flex items-center justify-center relative">
                    <UtensilsCrossed className="w-8 h-8 text-neutral-300 dark:text-[#2A2A2A]" />
                    {hasDiscount && (
                        <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider">
                            {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col flex-grow w-full items-center text-center mt-3 sm:mt-4">
                <h3 className={cn("text-sm sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight truncate w-full", isAm && 'font-ethiopic font-bold')}>
                    {name}
                </h3>

                {desc && (
                    <p className={cn("text-xs text-neutral-500 dark:text-[#A3A3A3] line-clamp-1 mt-0.5 w-full", isAm && "font-ethiopic")}>
                        {desc}
                    </p>
                )}

                <div className="mt-auto w-full pt-1 flex flex-col items-center">
                    {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5 flex-wrap justify-center mt-1">
                            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                                {discountPriceFormatted}
                            </span>
                            <span className="text-xs font-bold line-through text-neutral-400 dark:text-neutral-500">
                                {regularPriceFormatted}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                -{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                            </span>
                        </div>
                    ) : (
                        <p className="text-lg sm:text-xl font-black text-[color:var(--color-brand-500)] text-center mt-1">
                            {regularPriceFormatted}
                        </p>
                    )}

                    {!item.isAvailable && (
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1.5", isAm && 'font-ethiopic')}>
                            {t('public.sold_out')}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};
