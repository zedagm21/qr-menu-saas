import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import {
    Search,
    X,
    UtensilsCrossed,
    Star,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    Info,
    CreditCard,
    Wifi,
    Share2
} from 'lucide-react';
import { publicApi } from '../../services/api';
import { formatCurrency, applyRestaurantTheme, getTranslation, isFastingItem, cn } from '../../lib/utils';
import { getCategoryIcon } from '../../lib/categoryIcons';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { FoodDetail } from '../../components/public/FoodDetail';
import { MenuFilterModal, type FilterState } from '../../components/public/MenuFilterModal';
import { RestaurantInfoModal } from '../../components/public/RestaurantInfoModal';
import { SocialMediaModal } from '../../components/public/SocialMediaModal';
import { PaymentModal } from '../../components/public/PaymentModal';
import { WifiModal } from '../../components/public/WifiModal';
import { QuickActionBar, QuickActionModal, type QuickAction } from '../../components/public/QuickActions';
import { OfflineNotice } from '../../components/public/OfflineNotice';
import { useDebounce } from '../../hooks/useDebounce';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Restaurant, PublicCategory, PublicMenuItem } from '../../types';

export default function PublicMenuPage() {
    const { t, i18n } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const tableParam = searchParams.get('table');
    const qrParam = searchParams.get('qr');

    const [lang, setLang] = useState<'EN' | 'AM'>(() => {
        const publicSaved = localStorage.getItem('public-menu-lang');
        if (publicSaved) {
            return publicSaved.toUpperCase() === 'AM' ? 'AM' : 'EN';
        }
        return 'EN';
    });
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 700);

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);
    const [showSocialMedia, setShowSocialMedia] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showWifi, setShowWifi] = useState(false);
    const [activeQuickAction, setActiveQuickAction] = useState<QuickAction>(null);
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

    // Auto-collapse when scrolling down past the 20% category header, re-expand when at top
    useEffect(() => {
        let lastScrollY = window.scrollY;
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 10);
            if (currentScrollY > 140) {
                if (currentScrollY > lastScrollY && isCategoriesExpanded) {
                    setIsCategoriesExpanded(false);
                }
            } else {
                setIsCategoriesExpanded(true);
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isCategoriesExpanded]);

    const handleLanguageToggle = () => {
        const nextLang = lang === 'EN' ? 'AM' : 'EN';
        setLang(nextLang);
        i18n.changeLanguage(nextLang.toLowerCase());
        localStorage.setItem('public-menu-lang', nextLang.toLowerCase());
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const shareData = {
            title: restaurant?.name || 'Menu',
            text: lang === 'AM'
                ? `${restaurant?.name || 'የምግብ'} ሜኑን ይመልከቱ`
                : `Check out the menu for ${restaurant?.name || 'this restaurant'}!`,
            url: shareUrl,
        };

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
                if (slug) publicApi.recordInteraction(slug, 'SOCIAL_CLICK');
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }

        // Fallback: copy link to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success(lang === 'AM' ? 'የሜኑ ሊንክ ተቀድቷል!' : 'Menu link copied to clipboard!', { id: 'menu-share-copied' });
            if (slug) publicApi.recordInteraction(slug, 'SOCIAL_CLICK');
        } catch {
            toast.error(lang === 'AM' ? 'ሊንኩን መቅዳት አልተቻለም' : 'Failed to copy link');
        }
    };

    const queryClient = useQueryClient();
    const { isOnline, wasOffline } = useNetworkStatus();

    const { data: restaurant, isLoading: restaurantLoading, isError, error } = useQuery<Restaurant>({
        queryKey: ['public-restaurant', slug, lang],
        queryFn: () => publicApi.getRestaurant(slug!, lang),
        enabled: !!slug,
        staleTime: 60_000,
        networkMode: 'offlineFirst',
        retry: 1,
    });

    const { data: categories = [], isLoading: menuLoading } = useQuery<PublicCategory[]>({
        queryKey: ['public-menu', slug, lang],
        queryFn: () => publicApi.getMenu(slug!, lang),
        enabled: !!slug && !!restaurant,
        staleTime: 30_000,
        networkMode: 'offlineFirst',
        retry: 1,
    });

    // When connection is restored after being offline, automatically re-sync latest menu changes
    useEffect(() => {
        if (isOnline && wasOffline && slug) {
            queryClient.invalidateQueries({ queryKey: ['public-restaurant', slug] });
            queryClient.invalidateQueries({ queryKey: ['public-menu', slug] });
        }
    }, [isOnline, wasOffline, slug, queryClient]);

    // Pre-warm the browser / Workbox image cache in the background for dish photos, logo, and cover
    useEffect(() => {
        if (categories && categories.length > 0) {
            const urlsToCache = new Set<string>();
            if (restaurant?.logoUrl) urlsToCache.add(restaurant.logoUrl);
            if (restaurant?.coverImageUrl) urlsToCache.add(restaurant.coverImageUrl);

            categories.forEach(cat => {
                cat.menuItems?.forEach(item => {
                    if (item.imageUrl) urlsToCache.add(item.imageUrl);
                });
            });

            // Delay pre-warming to avoid competing with critical initial load network requests
            const timer = setTimeout(() => {
                const loadImages = () => {
                    urlsToCache.forEach(url => {
                        const img = new Image();
                        img.src = url;
                    });
                };

                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(loadImages);
                } else {
                    loadImages();
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [categories, restaurant]);

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

        return () => {
            const dashboardTheme = localStorage.getItem('dashboard-theme') || 'auto';
            root.classList.remove('light', 'dark');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const effective = dashboardTheme === 'auto'
                ? systemPrefersDark
                : dashboardTheme === 'dark';
            root.classList.add(effective ? 'dark' : 'light');
            root.style.colorScheme = effective ? 'dark' : 'light';
        };
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

    // Synchronize language for public menu without polluting owner dashboard language
    useEffect(() => {
        const publicSaved = localStorage.getItem('public-menu-lang');
        const initial = publicSaved || (restaurant?.defaultLanguage ? restaurant.defaultLanguage.toLowerCase() : 'en');
        const initialUpper = initial.toUpperCase() === 'AM' ? 'AM' : 'EN';
        setLang(initialUpper);
        i18n.changeLanguage(initialUpper.toLowerCase());

        return () => {
            // Restore owner dashboard language upon leaving the public menu
            const dashboardLang = localStorage.getItem('ui-language') || 'en';
            i18n.changeLanguage(dashboardLang);
        };
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
            if (item.isFasting !== true) return false;
        } else if (filters.fasting === 'non-fasting') {
            if (item.isFasting !== false) return false;
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

    const totalItemCount = useMemo(() => {
        return categories.reduce((sum, cat) => sum + (cat.menuItems?.length || 0), 0);
    }, [categories]);

    // ─── Analytics Tracking ──────────────────────────────────────────────────
    // 1. Record QR scan once per session
    useEffect(() => {
        if (!slug || !restaurant || restaurant.isSuspended) return;
        const sessionScanKey = `scanned:${slug}`;
        if (!sessionStorage.getItem(sessionScanKey)) {
            sessionStorage.setItem(sessionScanKey, 'true');
            publicApi.recordScan(slug, {
                table: tableParam || undefined,
                qr: qrParam || undefined,
                language: lang,
            });
        }
    }, [slug, restaurant, tableParam, qrParam, lang]);

    // 2. Record debounced customer search demand
    useEffect(() => {
        if (!slug || !debouncedSearch || debouncedSearch.trim().length < 2) return;
        const totalMatches = filteredCategories.reduce((acc, cat) => acc + cat.menuItems.length, 0);
        publicApi.recordSearch(slug, debouncedSearch.trim(), totalMatches);
    }, [debouncedSearch, slug, filteredCategories]);

    // 3. Track dish modal clicks
    const handleSelectItem = (item: any) => {
        setSelectedItem(item);
        if (slug && item?.id) {
            publicApi.recordItemClick(slug, item.id);
        }
    };

    // 4. Track profile view
    const handleOpenRestaurantInfo = () => {
        setShowRestaurantInfo(true);
        if (slug) {
            publicApi.recordInteraction(slug, 'PROFILE_VIEW');
        }
    };

    const menuStyle = restaurant?.theme?.menuStyle || 'MODERN';

    if (restaurantLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#111111]">
            <div className="w-10 h-10 border-4 border-[color:var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ─── Suspension Screen ───
    const isSuspended = Boolean(
        restaurant?.isSuspended ||
        (error as any)?.response?.data?.isSuspended ||
        (error as any)?.response?.status === 403
    );

    if (isSuspended) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#111111] text-center px-4 animate-fade-in">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-[#2A2A2A]">
                    <span className="text-3xl">🍽️</span>
                </div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-[#F5F5F5] tracking-tight">
                    {t("public.menu_temporarily_suspended", { defaultValue: "Menu Temporarily Unavailable" })}
                </h1>
                <p className="text-neutral-500 dark:text-[#A3A3A3] mt-2 font-medium max-w-sm text-sm">
                    {t("public.menu_temporarily_suspended_desc", { defaultValue: "This menu is currently unavailable. Please check back shortly or speak with your server." })}
                </p>
            </div>
        );
    }

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

    const translations = restaurant.translations ?? [];
    const displayDesc = getTranslation(translations, lang, 'description') || restaurant.description || '';
    const displayAddress = getTranslation(translations, lang, 'address') || restaurant.address || '';
    const displayCity = getTranslation(translations, lang, 'city') || restaurant.city || '';
    const hasInfo = Boolean(displayDesc || restaurant.phone || restaurant.email || displayAddress || displayCity || restaurant.country);
    const hasPayment = Boolean(restaurant.paymentInfo && restaurant.paymentInfo.trim());
    const hasWifi = Boolean(restaurant.wifiName || restaurant.wifiPassword);

    return (
        <ThemeProvider theme={restaurant.theme}>
            <Helmet>
                <title>{restaurant.name} — {t("public.menu_label")}</title>
                <style>{`body { font-family: ${fontStack}; }`}</style>
            </Helmet>

            <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#111111] transition-colors" dir="ltr">
                <OfflineNotice isOnline={isOnline} wasOffline={wasOffline} isAm={lang === 'AM'} />

                {/* ─── Sticky Top Bar (Hovering over cover at top, frosted glass when scrolled) ─── */}
                <div className={cn(
                    "sticky top-0 z-50 h-14 px-4 flex items-center justify-between transition-all duration-200",
                    isScrolled
                        ? "bg-neutral-900/85 dark:bg-neutral-950/90 backdrop-blur-md border-b border-white/10 shadow-sm"
                        : "bg-transparent border-b border-transparent"
                )}>
                    {/* Left side: Logo + MENU text (Clickable -> Opens Restaurant Info Modal) */}
                    <button
                        type="button"
                        onClick={handleOpenRestaurantInfo}
                        aria-label={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                        className="flex items-center gap-2.5 p-1 -ml-1 rounded-full hover:bg-white/15 active:scale-95 transition-all cursor-pointer group"
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

                    {/* Right side: Info + Share + Language + Theme Toggle */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={handleOpenRestaurantInfo}
                            aria-label={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                            title={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-sm transition-colors flex items-center justify-center text-white/90 cursor-pointer border border-white/10"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label={t("public.share_menu", { defaultValue: "Share Menu" })}
                            title={t("public.share_menu", { defaultValue: "Share Menu" })}
                            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-sm transition-colors flex items-center justify-center text-white/90 cursor-pointer border border-white/10"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleLanguageToggle}
                            aria-label={t("public.language_switch")}
                            className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors text-white/90 text-xs font-bold border border-white/10"
                        >
                            {lang === 'EN' ? 'አማ' : 'EN'}
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors flex items-center justify-center text-white/90 border border-white/10"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                {/* ─── Hero Section (20% Viewport Height on Mobile, Spacious on Desktop) ─── */}
                <header className="relative -mt-14 pt-14 pb-2 sm:pt-20 sm:pb-10 px-4 h-[20vh] min-h-[160px] sm:h-auto sm:min-h-[250px] md:min-h-[290px] flex items-center justify-center animate-fade-in-up delay-0 overflow-hidden">
                    {/* Cover image as background spanning top-0 behind top bar */}
                    {restaurant.coverImageUrl ? (
                        <div className="absolute inset-0">
                            <img src={restaurant.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                            {/* Gentle top shadow for top-bar contrast */}
                            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
                            {/* Gentle bottom shadow for smooth page transition */}
                            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
                            {/* Subtle ambient contrast */}
                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black overflow-hidden">
                            {/* Subtle Ambient Brand Glow */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[120%] h-48 bg-gradient-to-b from-[color:var(--color-brand-500)]/30 via-[color:var(--color-brand-600)]/15 to-transparent rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[color:var(--color-brand-500)]/20 via-transparent to-black/80 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                        </div>
                    )}

                    {/* Content overlays the image */}
                    <div className="relative flex flex-col items-center justify-center text-center z-20 max-w-lg mx-auto">
                        <h1 className={cn("text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] filter", lang === 'AM' && 'font-ethiopic')}>
                            {restaurant.name}
                        </h1>

                        {/* Quick action utility badges (Payment, WiFi, Socials) */}
                        {(restaurant.paymentInfo || restaurant.wifiName || restaurant.wifiPassword || (Array.isArray(restaurant.socialMedia) && restaurant.socialMedia.some(s => s && s.url && s.url.trim() !== ''))) && (
                            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap mt-2.5 sm:mt-3.5">
                                {restaurant.paymentInfo && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPayment(true)}
                                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold transition-all border border-white/25 shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                        <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{t('public.payment', { defaultValue: 'Payment' })}</span>
                                    </button>
                                )}

                                {(restaurant.wifiName || restaurant.wifiPassword) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowWifi(true)}
                                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold transition-all border border-white/25 shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                        <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{t('public.wifi', { defaultValue: 'WiFi' })}</span>
                                    </button>
                                )}

                                {Array.isArray(restaurant.socialMedia) && restaurant.socialMedia.some(s => s && s.url && s.url.trim() !== '') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSocialMedia(true);
                                            if (slug) publicApi.recordInteraction(slug, 'SOCIAL_CLICK');
                                        }}
                                        className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold transition-all border border-white/25 shadow-2xs active:scale-95 cursor-pointer"
                                    >
                                        <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        <span>{t('public.socials', { defaultValue: 'Socials' })}</span>
                                    </button>
                                )}
                            </div>
                        )}
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

                        {categories.length > 0 && (
                            <div className="pt-0.5">
                                {!isCategoriesExpanded ? (
                                    /* ─── Compact Horizontal Scrolling View with Expand Button ─── */
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1 min-w-0 -mx-1 px-1">
                                            <button
                                                onClick={() => setActiveCategory(null)}
                                                className={cn(
                                                    "group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[13.5px] sm:text-[15px] font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer active:scale-95 select-none shrink-0 shadow-2xs",
                                                    !activeCategory
                                                        ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                        : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                    lang === 'AM' && 'font-ethiopic'
                                                )}
                                            >
                                                <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">🍽️</span>
                                                <span>{t("public.all_items", { defaultValue: "All" })}</span>
                                                <span
                                                    className={cn(
                                                        "px-1.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
                                                        !activeCategory
                                                            ? "bg-white/25 text-white"
                                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-[#A3A3A3] group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                                                    )}
                                                >
                                                    {totalItemCount}
                                                </span>
                                            </button>

                                            {categories.map(cat => {
                                                const isActive = activeCategory === cat.id;
                                                const count = cat.menuItems?.length || 0;
                                                const icon = getCategoryIcon(cat.name);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setActiveCategory(isActive ? null : cat.id)}
                                                        className={cn(
                                                            "group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[13.5px] sm:text-[15px] font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer active:scale-95 select-none shrink-0 shadow-2xs",
                                                            isActive
                                                                ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                                : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                            lang === 'AM' && 'font-ethiopic'
                                                        )}
                                                    >
                                                        <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">{icon}</span>
                                                        <span>{cat.name}</span>
                                                        <span
                                                            className={cn(
                                                                "px-1.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
                                                                isActive
                                                                    ? "bg-white/25 text-white"
                                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-[#A3A3A3] group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                                                            )}
                                                        >
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Expand Toggle Button */}
                                        {categories.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoriesExpanded(true)}
                                                aria-label={lang === 'AM' ? 'ሁሉንም ምድቦች አሳይ' : 'Expand all categories'}
                                                title={lang === 'AM' ? 'ሁሉንም ምድቦች አሳይ' : 'Expand all categories'}
                                                className="shrink-0 h-8 sm:h-9 px-2 sm:px-2.5 rounded-full bg-neutral-100 dark:bg-[#222222] border border-neutral-200/80 dark:border-[#2A2A2A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-[#2e2e2e] active:scale-95 transition-all flex items-center gap-1 text-xs font-bold shadow-2xs select-none cursor-pointer"
                                            >
                                                <ChevronDown className="w-3.5 h-3.5" />
                                                <span className="hidden xs:inline">{categories.length}</span>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    /* ─── Expanded Multi-Row Grid View with Collapse Button ─── */
                                    <div className="space-y-2 animate-fade-in">
                                        <div className="flex items-center justify-between px-0.5">
                                            <span className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500", lang === 'AM' && 'font-ethiopic')}>
                                                {lang === 'AM' ? `ምድቦች (${categories.length})` : `Categories (${categories.length})`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoriesExpanded(false)}
                                                aria-label={lang === 'AM' ? 'አሳጥር' : 'Collapse'}
                                                className="h-7 sm:h-8 px-2.5 rounded-full bg-neutral-100 dark:bg-[#222222] border border-neutral-200/80 dark:border-[#2A2A2A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-[#2e2e2e] active:scale-95 transition-all flex items-center gap-1 text-xs font-bold select-none cursor-pointer"
                                            >
                                                <ChevronUp className="w-3.5 h-3.5" />
                                                <span>{lang === 'AM' ? 'አሳጥር' : 'Collapse'}</span>
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-[45vh] overflow-y-auto hide-scrollbar pt-0.5">
                                            <button
                                                onClick={() => {
                                                    setActiveCategory(null);
                                                    setIsCategoriesExpanded(false);
                                                }}
                                                className={cn(
                                                    "group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[13.5px] sm:text-[15px] font-bold transition-all duration-200 border cursor-pointer active:scale-95 select-none shadow-2xs",
                                                    !activeCategory
                                                        ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                        : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                    lang === 'AM' && 'font-ethiopic'
                                                )}
                                            >
                                                <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">🍽️</span>
                                                <span>{t("public.all_items", { defaultValue: "All" })}</span>
                                                <span
                                                    className={cn(
                                                        "px-1.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
                                                        !activeCategory
                                                            ? "bg-white/25 text-white"
                                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-[#A3A3A3] group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                                                    )}
                                                >
                                                    {totalItemCount}
                                                </span>
                                            </button>

                                            {categories.map(cat => {
                                                const isActive = activeCategory === cat.id;
                                                const count = cat.menuItems?.length || 0;
                                                const icon = getCategoryIcon(cat.name);
                                                return (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setActiveCategory(isActive ? null : cat.id);
                                                            setIsCategoriesExpanded(false);
                                                        }}
                                                        className={cn(
                                                            "group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[13.5px] sm:text-[15px] font-bold transition-all duration-200 border cursor-pointer active:scale-95 select-none shadow-2xs",
                                                            isActive
                                                                ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                                : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                            lang === 'AM' && 'font-ethiopic'
                                                        )}
                                                    >
                                                        <span className="text-base sm:text-lg leading-none shrink-0" aria-hidden="true">{icon}</span>
                                                        <span>{cat.name}</span>
                                                        <span
                                                            className={cn(
                                                                "px-1.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
                                                                isActive
                                                                    ? "bg-white/25 text-white"
                                                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-[#A3A3A3] group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
                                                            )}
                                                        >
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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

                                    {/* Responsive Showcase Grid (2 Columns on Mobile) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                                        {featuredItems.map((item, idx) => (
                                            <div
                                                key={`featured-${item.id}`}
                                                className="animate-fade-in-up h-full"
                                                style={{ animationDelay: `${Math.min(idx * 60 + 80, 400)}ms` }}
                                            >
                                                <MenuItemCard
                                                    item={item}
                                                    lang={lang}
                                                    onClick={() => handleSelectItem(item)}
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

                                    {/* DYNAMIC 2-COL MOBILE GRID LAYOUT */}
                                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                                        {cat.menuItems.map((item: PublicMenuItem, idx: number) => (
                                            <div
                                                key={item.id}
                                                className="animate-fade-in-up h-full"
                                                style={{ animationDelay: `${Math.min(idx * 50 + 100, 500)}ms` }}
                                            >
                                                <MenuItemCard
                                                    item={item}
                                                    lang={lang}
                                                    onClick={() => handleSelectItem(item)}
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
                    onSocialClick={(platform) => slug && publicApi.recordInteraction(slug, 'SOCIAL_CLICK', platform)}
                    onCallClick={() => slug && publicApi.recordInteraction(slug, 'CALL_CLICK')}
                    onDirectionsClick={() => slug && publicApi.recordInteraction(slug, 'DIRECTIONS_CLICK')}
                />

                {/* ─── Dedicated Social Media Modal ─── */}
                <SocialMediaModal
                    isOpen={showSocialMedia}
                    onClose={() => setShowSocialMedia(false)}
                    restaurant={restaurant}
                    isAm={lang === 'AM'}
                    onSocialClick={(platform) => slug && publicApi.recordInteraction(slug, 'SOCIAL_CLICK', platform)}
                />

                {/* ─── Dedicated Payment Modal ─── */}
                <PaymentModal
                    isOpen={showPayment}
                    onClose={() => setShowPayment(false)}
                    restaurant={restaurant}
                    isAm={lang === 'AM'}
                />

                {/* ─── Dedicated WiFi Modal ─── */}
                <WifiModal
                    isOpen={showWifi}
                    onClose={() => setShowWifi(false)}
                    restaurant={restaurant}
                    isAm={lang === 'AM'}
                />

                {/* ─── Quick Action Pop-up Modal / Bottom-Sheet (Info, Payment, Wi-Fi) ─── */}
                <QuickActionModal
                    isOpen={!!activeQuickAction}
                    activeAction={activeQuickAction || 'info'}
                    onChangeAction={(action) => setActiveQuickAction(action)}
                    onClose={() => setActiveQuickAction(null)}
                    restaurant={restaurant}
                    isAm={lang === 'AM'}
                    onCallClick={() => slug && publicApi.recordInteraction(slug, 'CALL_CLICK')}
                    onDirectionsClick={() => slug && publicApi.recordInteraction(slug, 'DIRECTIONS_CLICK')}
                    onSocialClick={(platform) => slug && publicApi.recordInteraction(slug, 'SOCIAL_CLICK', platform)}
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
                    "w-full h-full flex flex-col items-stretch text-left bg-white dark:bg-neutral-900/95 rounded-2xl group transition-all duration-300",
                    "border shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
                    item.isFeatured
                        ? "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-50/15 dark:bg-amber-950/10"
                        : "border-neutral-200/80 dark:border-neutral-800/80",
                    "overflow-hidden",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {/* Image Section */}
                <div className="w-full aspect-[4/3] relative overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800">
                    {hasImage ? (
                        <img
                            src={item.imageUrl}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <span className="text-3xl filter drop-shadow-sm">🍽️</span>
                        </div>
                    )}
                    {item.isFeatured && (
                        <span className={cn("absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm", isAm && 'font-ethiopic')}>
                            <Star className="w-2.5 h-2.5 fill-white text-white" /> {t('public.featured')}
                        </span>
                    )}
                    {hasDiscount && (
                        <span className={cn("absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm", isAm && 'font-ethiopic')}>
                            <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </span>
                    )}
                </div>

                {/* Text Section */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                    <h3 className={cn("text-xs sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight mb-1 truncate w-full", isAm && 'font-ethiopic')}>
                        {name}
                    </h3>

                    {desc && (
                        <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-2 leading-snug w-full", isAm && "font-ethiopic")}>
                            {desc}
                        </p>
                    )}

                    <div className="mt-auto pt-1 flex items-center justify-between">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                                <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold line-through text-neutral-400 dark:text-neutral-500 leading-none">
                                    {regularPriceFormatted}
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm sm:text-lg font-black text-[color:var(--color-brand-500)] leading-none">
                                {regularPriceFormatted}
                            </p>
                        )}
                        {!item.isAvailable && (
                            <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider", isAm && 'font-ethiopic')}>
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
                    <div className="w-full aspect-[4/3] bg-neutral-100 dark:bg-[#111111] relative overflow-hidden shrink-0">
                        <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 dark:opacity-20 flex-none" />

                        <div className="absolute top-2 left-2 flex flex-wrap gap-1 pr-8 z-10">
                            {item.isFeatured && (
                                <div className={cn("bg-amber-500 text-white text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" /> {t('public.featured')}
                                </div>
                            )}
                            {hasDiscount && (
                                <div className={cn("bg-emerald-600 text-white text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full aspect-[4/3] bg-neutral-50 dark:bg-[#111111] shrink-0 border-b border-neutral-100 dark:border-[#2A2A2A] flex items-center justify-center relative">
                        <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300 dark:text-[#2A2A2A]" />
                        {hasDiscount && (
                            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider">
                                <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                            </div>
                        )}
                    </div>
                )}

                <div className="p-3 sm:p-5 flex flex-col flex-grow">
                    <h3 className={cn("text-xs sm:text-lg font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight mb-1 truncate", elegantFontClass, isAm && 'font-ethiopic font-bold')}>
                        {name}
                    </h3>
                    {desc && (
                        <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-[#A3A3A3] line-clamp-1 leading-snug mb-2", isAm && "font-ethiopic")}>
                            {desc}
                        </p>
                    )}

                    <div className="mt-auto pt-1 flex items-center justify-between border-t border-black/5 dark:border-[#2A2A2A]">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap pt-1.5">
                                <span className={cn("text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400", elegantFontClass)}>
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium line-through text-neutral-400 dark:text-[#A3A3A3]">
                                    {regularPriceFormatted}
                                </span>
                            </div>
                        ) : (
                            <p className={cn("text-sm sm:text-lg font-bold text-[color:var(--color-brand-500)] pt-1.5", elegantFontClass)}>
                                {regularPriceFormatted}
                            </p>
                        )}
                        {!item.isAvailable && (
                            <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1.5", isAm && 'font-ethiopic')}>
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
                    "flex flex-col items-center justify-start p-3 sm:p-5 group",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {hasImage ? (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-100 dark:bg-[#111111] border border-amber-900/5 dark:border-amber-100/5 shadow-inner">
                        <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-50" />

                        {item.isFeatured && <div className={cn("absolute top-1 left-1 bg-amber-500 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>{t('public.featured')}</div>}
                        {hasDiscount && <div className={cn("absolute bottom-1 left-1 bg-emerald-600 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>{discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}</div>}
                    </div>
                ) : (
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-amber-100/50 dark:bg-amber-900/30 flex items-center justify-center shadow-inner border border-amber-900/5 dark:border-amber-100/5">
                        <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700/30 dark:text-amber-200/20" />
                    </div>
                )}

                <div className="flex flex-col flex-grow w-full items-center text-center mt-2.5 sm:mt-4">
                    <h3 className={cn("text-xs sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight truncate w-full", classicFontClass, isAm && 'font-ethiopic')}>
                        {name}
                    </h3>
                    {desc && <p className={cn("text-[11px] sm:text-xs text-neutral-600 dark:text-[#A3A3A3] line-clamp-1 mt-0.5 w-full", isAm && "font-ethiopic")}>{desc}</p>}
                    <div className="mt-auto w-full pt-1 flex flex-col items-center">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap justify-center mt-1">
                                <span className={cn("text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400", classicFontClass)}>
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium line-through text-neutral-400 dark:text-[#A3A3A3]">
                                    {regularPriceFormatted}
                                </span>
                            </div>
                        ) : (
                            <p className={cn("text-sm sm:text-lg font-bold text-[color:var(--color-brand-500)] text-center mt-1", classicFontClass)}>{regularPriceFormatted}</p>
                        )}
                        {!item.isAvailable && <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-200/50 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1", isAm && 'font-ethiopic')}>{t('public.sold_out')}</span>}
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
                "flex flex-col items-center justify-start p-3 sm:p-5 group",
                !item.isAvailable && "opacity-60 grayscale-[50%]"
            )}
        >
            {hasImage ? (
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-100 dark:bg-[#111111] border border-black/5 dark:border-white/5">
                    <img src={item.imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                    {/* Dark gradient for badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-50" />

                    {/* Badges container */}
                    {item.isFeatured && (
                        <div className={cn("absolute top-1 left-1 bg-amber-500 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>
                            {t('public.featured')}
                        </div>
                    )}
                    {hasDiscount && (
                        <div className={cn("absolute bottom-1 left-1 bg-emerald-600 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider", isAm && 'font-ethiopic')}>
                            {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full mx-auto mt-1 relative overflow-hidden shrink-0 bg-neutral-50 dark:bg-[#111111] border border-neutral-200 dark:border-[#2A2A2A] flex items-center justify-center relative">
                    <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300 dark:text-[#2A2A2A]" />
                    {hasDiscount && (
                        <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center shadow-lg uppercase tracking-wider">
                            {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col flex-grow w-full items-center text-center mt-2.5 sm:mt-4">
                <h3 className={cn("text-xs sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight truncate w-full", isAm && 'font-ethiopic font-bold')}>
                    {name}
                </h3>

                {desc && (
                    <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-[#A3A3A3] line-clamp-1 mt-0.5 w-full", isAm && "font-ethiopic")}>
                        {desc}
                    </p>
                )}

                <div className="mt-auto w-full pt-1 flex flex-col items-center">
                    {hasDiscount ? (
                        <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap justify-center mt-1">
                            <span className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                                {discountPriceFormatted}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold line-through text-neutral-400 dark:text-neutral-500">
                                {regularPriceFormatted}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm sm:text-lg font-black text-[color:var(--color-brand-500)] text-center mt-1">
                            {regularPriceFormatted}
                        </p>
                    )}

                    {!item.isAvailable && (
                        <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1", isAm && 'font-ethiopic')}>
                            {t('public.sold_out')}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};
