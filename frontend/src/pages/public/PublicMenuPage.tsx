import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
    Share2,
    Plus,
    Minus
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
import { OrderTray } from '../../components/public/OrderTray';
import { OrderModal } from '../../components/public/OrderModal';
import { DishImage } from '../../components/public/DishImage';
import { useDebounce } from '../../hooks/useDebounce';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Restaurant, PublicCategory, PublicMenuItem } from '../../types';
import type { OrderTab } from '../../types/order';

export default function PublicMenuPage() {
    const { t, i18n } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
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

    const sentinelRef = useRef<HTMLDivElement>(null);
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

    const [coverAspect, setCoverAspect] = useState<number | null>(null);
    const isWideBanner = coverAspect === null || coverAspect >= 1.8;

    const categoryPillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [tab, setTab] = useState<OrderTab>(() => {
        try {
            if (!slug) return {};
            const saved = localStorage.getItem(`ourmenu_tab_${slug}`);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        if (slug) {
            try {
                localStorage.setItem(`ourmenu_tab_${slug}`, JSON.stringify(tab));
            } catch {}
        }
    }, [tab, slug]);

    // Center selected category pill smoothly in horizontal scroll view
    useEffect(() => {
        if (activeCategory && categoryPillRefs.current[activeCategory]) {
            categoryPillRefs.current[activeCategory]?.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            });
        }
    }, [activeCategory]);

    const handleUpdateTabQuantity = (item: PublicMenuItem, delta: number) => {
        setTab((prev) => {
            const existing = prev[item.id];
            const newQty = (existing?.quantity || 0) + delta;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[item.id];
                return next;
            }
            return {
                ...prev,
                [item.id]: {
                    item,
                    quantity: newQty,
                },
            };
        });
    };

    const handleRemoveTabItem = (itemId: string) => {
        setTab((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    const handleClearTab = () => {
        setTab({});
        if (slug) {
            localStorage.removeItem(`ourmenu_tab_${slug}`);
        }
        toast.success(lang === 'AM' ? 'ትዕዛዞች ተሰርዘዋል' : 'Orders cleared');
    };

    const tabItemsList = Object.values(tab);
    const tabTotalCount = tabItemsList.reduce((acc, curr) => acc + curr.quantity, 0);
    const tabTotalAmount = tabItemsList.reduce((acc, curr) => {
        const p = parseFloat(curr.item.discountPrice || curr.item.price || '0');
        return acc + (isNaN(p) ? 0 : p * curr.quantity);
    }, 0);

    // Auto-collapse when scrolling down once categories slide under the sticky search header, remain collapsed
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsScrolled(currentScrollY > 10);

            if (isCategoriesExpanded && sentinelRef.current) {
                const rect = sentinelRef.current.getBoundingClientRect();
                // When the bottom of the category grid slides under the sticky search header (110px = 56px topbar + 54px searchbar)
                if (rect.top <= 110) {
                    setIsCategoriesExpanded(false);
                }
            }
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

    // If accessed via an old slug alias, seamless redirect to the restaurant's active canonical slug
    useEffect(() => {
        if (restaurant?.slug && slug && restaurant.slug !== slug) {
            navigate(`/r/${restaurant.slug}${location.search}`, { replace: true });
        }
    }, [restaurant?.slug, slug, navigate, location.search]);

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

    const getGridClass = (style: string) => {
        switch (style) {
            case 'ELEGANT':
                return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6';
            case 'MINIMAL':
                return 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5';
            case 'MODERN':
                return 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4';
            case 'CLASSIC':
            default:
                return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4';
        }
    };

    return (
        <ThemeProvider theme={restaurant.theme}>
            <Helmet>
                <title>{restaurant.name} — {t("public.menu_label")}</title>
                <style>{`body { font-family: ${fontStack}; }`}</style>
            </Helmet>

            <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#111111] transition-colors" dir="ltr">
                <OfflineNotice isOnline={isOnline} wasOffline={wasOffline} isAm={lang === 'AM'} />

                {/* ─── Sticky Top Bar ─── */}
                <div className={cn(
                    "sticky top-0 z-50 h-14 px-3.5 sm:px-4 flex items-center justify-between transition-all duration-200",
                    "bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-b border-black/5 dark:border-[#222222] shadow-2xs"
                )}>
                    {/* Left side: Logo + Restaurant Name (Clickable -> Opens Restaurant Info Modal) */}
                    <button
                        type="button"
                        onClick={handleOpenRestaurantInfo}
                        aria-label={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                        className="flex items-center gap-2.5 p-1 -ml-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer group min-w-0"
                    >
                        {restaurant.logoUrl ? (
                            <img src={restaurant.logoUrl} alt="Logo" className="w-8 h-8 rounded-full border border-black/10 dark:border-white/20 shadow-xs object-cover group-hover:scale-105 transition-transform shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[color:var(--color-brand-500)]/15 dark:bg-[color:var(--color-brand-500)]/25 text-[color:var(--color-brand-500)] flex items-center justify-center font-bold text-sm shrink-0">
                                {restaurant.name?.[0] || '🍽️'}
                            </div>
                        )}
                        <span className={cn(
                            "text-neutral-900 dark:text-[#F5F5F5] group-hover:text-[color:var(--color-brand-500)] font-black text-sm sm:text-base tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[320px] transition-colors",
                            lang === 'AM' && 'font-ethiopic font-bold'
                        )}>
                            {restaurant.name}
                        </span>
                    </button>

                    {/* Right side: Info + Share + Language + Theme Toggle */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleOpenRestaurantInfo}
                            aria-label={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                            title={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2e2e2e] active:scale-95 transition-colors flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer border border-neutral-200/80 dark:border-[#333333]"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            aria-label={t("public.share_menu", { defaultValue: "Share Menu" })}
                            title={t("public.share_menu", { defaultValue: "Share Menu" })}
                            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2e2e2e] active:scale-95 transition-colors flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer border border-neutral-200/80 dark:border-[#333333]"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleLanguageToggle}
                            aria-label={t("public.language_switch")}
                            className="px-2.5 sm:px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2e2e2e] transition-colors text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200/80 dark:border-[#333333]"
                        >
                            {lang === 'EN' ? 'አማ' : 'EN'}
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2e2e2e] transition-colors flex items-center justify-center text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-[#333333]"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>

                {/* ─── Desktop Cover Image Banner (Spacious & Uncropped with Smart Aspect Limit) ─── */}
                {restaurant.coverImageUrl && (
                    <div className="hidden md:block max-w-6xl mx-auto px-4 lg:px-8 pt-3 pb-1">
                        <div
                            onClick={handleOpenRestaurantInfo}
                            className="relative w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-[#181818] border border-neutral-200/80 dark:border-[#282828] shadow-xs cursor-pointer group flex items-center justify-center h-48 md:h-60 lg:h-72 max-h-[300px]"
                            title={t("public.about_restaurant", { defaultValue: "About Restaurant" })}
                        >
                            {/* Ambient blurred backdrop so letterbox areas softly match the image colors */}
                            <div
                                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 dark:opacity-20 scale-110 pointer-events-none"
                                style={{ backgroundImage: `url(${restaurant.coverImageUrl})` }}
                            />
                            {/* Cover Image with Smart Non-Crop Limit */}
                            <img
                                src={restaurant.coverImageUrl}
                                alt={restaurant.name}
                                onLoad={(e) => {
                                    const { naturalWidth, naturalHeight } = e.currentTarget;
                                    if (naturalWidth && naturalHeight) {
                                        setCoverAspect(naturalWidth / naturalHeight);
                                    }
                                }}
                                className={cn(
                                    "relative z-10 rounded-2xl group-hover:scale-[1.008] transition-transform duration-300",
                                    isWideBanner
                                        ? "w-full h-full max-h-[300px] object-contain"
                                        : "w-full h-full object-cover object-center"
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* ─── Dedicated Quick Actions Row (Payments, WiFi, Socials) ─── */}
                {(hasPayment || hasWifi || (Array.isArray(restaurant.socialMedia) && restaurant.socialMedia.some(s => s && s.url && s.url.trim() !== ''))) && (
                    <div className="bg-white/80 dark:bg-[#151515]/80 backdrop-blur-xs border-b border-black/5 dark:border-[#222222] py-2 px-3 sm:px-4">
                        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                            {hasPayment && (
                                <button
                                    type="button"
                                    onClick={() => setShowPayment(true)}
                                    className="flex-1 sm:flex-initial min-w-[90px] max-w-[150px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2c2c2c] text-neutral-800 dark:text-[#F5F5F5] text-xs font-bold transition-all border border-neutral-200/80 dark:border-[#333333] shadow-2xs active:scale-95 cursor-pointer"
                                >
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>{t('public.payment', { defaultValue: 'Payments' })}</span>
                                </button>
                            )}

                            {hasWifi && (
                                <button
                                    type="button"
                                    onClick={() => setShowWifi(true)}
                                    className="flex-1 sm:flex-initial min-w-[90px] max-w-[150px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2c2c2c] text-neutral-800 dark:text-[#F5F5F5] text-xs font-bold transition-all border border-neutral-200/80 dark:border-[#333333] shadow-2xs active:scale-95 cursor-pointer"
                                >
                                    <Wifi className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
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
                                    className="flex-1 sm:flex-initial min-w-[90px] max-w-[150px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#222222] dark:hover:bg-[#2c2c2c] text-neutral-800 dark:text-[#F5F5F5] text-xs font-bold transition-all border border-neutral-200/80 dark:border-[#333333] shadow-2xs active:scale-95 cursor-pointer"
                                >
                                    <Share2 className="w-3.5 h-3.5 text-[color:var(--color-brand-500)] shrink-0" />
                                    <span>{t('public.socials', { defaultValue: 'Socials' })}</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Sticky Search Header (z-30 so category grid slides smoothly under it) ─── */}
                <div className="sticky top-14 z-30 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-black/5 dark:border-[#2A2A2A] shadow-xs py-2">
                    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 space-y-2">
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

                        {/* Fasting (የጾም) Filter Toggle Switch */}
                        <div className="flex items-center justify-between py-1.5 px-3 rounded-2xl bg-neutral-100/80 dark:bg-[#111111] border border-neutral-200/80 dark:border-[#2A2A2A]">
                            <div
                                className="flex items-center gap-2 select-none cursor-pointer"
                                onClick={() => setFilters(prev => ({ ...prev, fasting: prev.fasting === 'fasting' ? 'all' : 'fasting' }))}
                            >
                                <span className="text-base" aria-hidden="true">🌿</span>
                                <span className={cn(
                                    "text-xs sm:text-[13px] font-extrabold text-neutral-800 dark:text-neutral-200",
                                    lang === 'AM' && 'font-ethiopic'
                                )}>
                                    {lang === 'AM' ? 'የጾም ብቻ' : 'Fasting Only (የጾም)'}
                                </span>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={filters.fasting === 'fasting'}
                                onClick={() => setFilters(prev => ({
                                    ...prev,
                                    fasting: prev.fasting === 'fasting' ? 'all' : 'fasting'
                                }))}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    filters.fasting === 'fasting'
                                        ? "bg-emerald-600 shadow-sm shadow-emerald-600/30"
                                        : "bg-neutral-300 dark:bg-neutral-700"
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                        filters.fasting === 'fasting' ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Compact single-row horizontal capsule bar (Active only when collapsed) */}
                        {categories.length > 0 && !isCategoriesExpanded && (
                            <div className="pt-0.5 animate-fade-in">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="flex-1 flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-0.5 min-w-0 -mx-1 px-1">
                                        <button
                                            ref={(el) => { categoryPillRefs.current['ALL'] = el; }}
                                            onClick={() => setActiveCategory(null)}
                                            className={cn(
                                                "group inline-flex items-center gap-1.5 px-2.5 py-[5px] sm:px-3 sm:py-1.5 rounded-full text-[13px] sm:text-[14.5px] font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer active:scale-95 select-none shrink-0 shadow-2xs",
                                                !activeCategory
                                                    ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                    : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                lang === 'AM' && 'font-ethiopic'
                                            )}
                                        >
                                            <span className="text-sm sm:text-base leading-none shrink-0" aria-hidden="true">🍽️</span>
                                            <span>{t("public.all_items", { defaultValue: "All" })}</span>
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
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
                                                    ref={(el) => { categoryPillRefs.current[cat.id] = el; }}
                                                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                                                    className={cn(
                                                        "group inline-flex items-center gap-1.5 px-2.5 py-[5px] sm:px-3 sm:py-1.5 rounded-full text-[13px] sm:text-[14.5px] font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer active:scale-95 select-none shrink-0 shadow-2xs",
                                                        isActive
                                                            ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                            : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                        lang === 'AM' && 'font-ethiopic'
                                                    )}
                                                >
                                                    <span className="text-sm sm:text-base leading-none shrink-0" aria-hidden="true">{icon}</span>
                                                    <span>{cat.name}</span>
                                                    <span
                                                        className={cn(
                                                            "px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
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
                                            className="shrink-0 h-7 sm:h-8 px-2 sm:px-2.5 rounded-full bg-neutral-100 dark:bg-[#222222] border border-neutral-200/80 dark:border-[#2A2A2A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-[#2e2e2e] active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold shadow-2xs select-none cursor-pointer"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                            <span className="hidden xs:inline">{categories.length}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Inline Expanded Category Grid (z-20 in document flow, smoothly slides under sticky search bar) ─── */}
                {categories.length > 0 && isCategoriesExpanded && (
                    <div className="relative z-20 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md border-b border-black/5 dark:border-[#2A2A2A] py-2.5 shadow-2xs">
                        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between px-0.5">
                                <span className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500", lang === 'AM' && 'font-ethiopic')}>
                                    {lang === 'AM' ? `ምድቦች (${categories.length})` : `Categories (${categories.length})`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoriesExpanded(false)}
                                    aria-label={lang === 'AM' ? 'አሳጥር' : 'Collapse'}
                                    className="h-6 sm:h-7 px-2.5 rounded-full bg-neutral-100 dark:bg-[#222222] border border-neutral-200/80 dark:border-[#2A2A2A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-[#2e2e2e] active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold select-none cursor-pointer"
                                >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    <span>{lang === 'AM' ? 'አሳጥር' : 'Collapse'}</span>
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                <button
                                    onClick={() => {
                                        setActiveCategory(null);
                                        setIsCategoriesExpanded(false);
                                    }}
                                    className={cn(
                                        "group inline-flex items-center gap-1.5 px-2.5 py-[5px] sm:px-3 sm:py-1.5 rounded-full text-[13px] sm:text-[14.5px] font-bold transition-all duration-200 border cursor-pointer active:scale-95 select-none shadow-2xs",
                                        !activeCategory
                                            ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                            : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                        lang === 'AM' && 'font-ethiopic'
                                    )}
                                >
                                    <span className="text-sm sm:text-base leading-none shrink-0" aria-hidden="true">🍽️</span>
                                    <span>{t("public.all_items", { defaultValue: "All" })}</span>
                                    <span
                                        className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
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
                                                "group inline-flex items-center gap-1.5 px-2.5 py-[5px] sm:px-3 sm:py-1.5 rounded-full text-[13px] sm:text-[14.5px] font-bold transition-all duration-200 border cursor-pointer active:scale-95 select-none shadow-2xs",
                                                isActive
                                                    ? "bg-[color:var(--color-brand-500)] text-white border-[color:var(--color-brand-500)] shadow-xs"
                                                    : "bg-white dark:bg-[#222222] text-neutral-700 dark:text-[#E5E5E5] border-neutral-200/80 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-[#2A2A2A] hover:border-neutral-300 dark:hover:border-neutral-700",
                                                lang === 'AM' && 'font-ethiopic'
                                            )}
                                        >
                                            <span className="text-sm sm:text-base leading-none shrink-0" aria-hidden="true">{icon}</span>
                                            <span>{cat.name}</span>
                                            <span
                                                className={cn(
                                                    "px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold leading-tight tabular-nums transition-colors ml-0.5",
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

                            {/* Bottom Sentinel to trigger collapse exactly when the last row slides under the search bar */}
                            <div ref={sentinelRef} className="h-0 w-full" />
                        </div>
                    </div>
                )}

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
                                    <div className={getGridClass(menuStyle)}>
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
                                                    quantityInTab={tab[item.id]?.quantity || 0}
                                                    onUpdateQuantity={(delta) => handleUpdateTabQuantity(item, delta)}
                                                    searchQuery={search}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ─── Regular Category Sections ─── */}
                            {filteredCategories.map(cat => {
                                const catName = cat.name;
                                const icon = getCategoryIcon(cat.name);
                                const count = cat.menuItems?.length || 0;

                                return (
                                    <div key={cat.id} className="scroll-mt-32">
                                        <div className={cn("mb-4 flex items-center justify-between gap-3", menuStyle === 'MINIMAL' && "mb-2.5")}>
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Category Icon Badge */}
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
                                                    {icon}
                                                </div>
                                                <div className="flex items-baseline gap-2 min-w-0">
                                                    <h2 className={cn("text-lg sm:text-xl font-black text-neutral-900 dark:text-[#F5F5F5] tracking-tight truncate", lang === 'AM' && 'font-ethiopic font-bold')}>
                                                        {catName}
                                                    </h2>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0">
                                                        {count}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow border-t border-neutral-200/80 dark:border-[#2A2A2A]" />
                                        </div>

                                        {/* DYNAMIC GRID LAYOUT */}
                                        <div className={getGridClass(menuStyle)}>
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
                                                        quantityInTab={tab[item.id]?.quantity || 0}
                                                        onUpdateQuantity={(delta) => handleUpdateTabQuantity(item, delta)}
                                                        searchQuery={search}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

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
                    quantityInTab={selectedItem ? tab[selectedItem.id]?.quantity || 0 : 0}
                    onUpdateQuantity={(delta) => selectedItem && handleUpdateTabQuantity(selectedItem, delta)}
                />

                {/* ─── Floating Diner Order Tray (Bottom Bar) ─── */}
                <OrderTray
                    totalCount={tabTotalCount}
                    totalAmount={tabTotalAmount}
                    currency={restaurant.currency || 'ETB'}
                    isAm={lang === 'AM'}
                    onOpenModal={() => setIsOrderModalOpen(true)}
                />

                {/* ─── Diner Table Tab Order Modal (WhatsApp & Waiter View) ─── */}
                <OrderModal
                    isOpen={isOrderModalOpen}
                    onClose={() => setIsOrderModalOpen(false)}
                    tab={tab}
                    onUpdateQuantity={(itemId, delta) => {
                        const entry = tab[itemId];
                        if (entry) handleUpdateTabQuantity(entry.item, delta);
                    }}
                    onRemoveItem={handleRemoveTabItem}
                    onClearTab={handleClearTab}
                    restaurant={restaurant}
                    initialTableNumber={tableParam}
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

// ─── Search Highlighting Component ───────────────────────────────────────────
const HighlightText: React.FC<{ text: string; highlight?: string; className?: string }> = ({
    text,
    highlight,
    className,
}) => {
    if (!highlight || !highlight.trim()) {
        return <span className={className}>{text}</span>;
    }
    const escaped = highlight.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className="bg-amber-300 dark:bg-amber-500/70 text-slate-950 dark:text-white px-0.5 rounded-xs font-black"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

// ─── Menu Item Card Component (4 Styles Differentiated with Tab Ordering) ───
const MenuItemCard = ({
    item,
    lang,
    onClick,
    menuStyle,
    quantityInTab = 0,
    onUpdateQuantity,
    searchQuery,
}: {
    item: any;
    lang: string;
    onClick: () => void;
    menuStyle: string;
    quantityInTab?: number;
    onUpdateQuantity?: (delta: number) => void;
    searchQuery?: string;
}) => {
    const { t } = useTranslation();
    const name = item.translations?.length ? getTranslation(item.translations, lang) : item.name ?? '';
    const desc = item.translations?.length ? getTranslation(item.translations, lang, 'description') : item.description ?? '';
    const isAm = lang === 'AM';
    const hasImage = !!item.imageUrl;

    const hasDiscount = item.discountPrice && parseFloat(item.discountPrice) < parseFloat(item.price);
    const regularPriceFormatted = formatCurrency(item.price, item.currency);
    const discountPriceFormatted = hasDiscount ? formatCurrency(item.discountPrice, item.currency) : '';
    const discountPercent = hasDiscount
        ? Math.round(((parseFloat(item.price) - parseFloat(item.discountPrice)) / parseFloat(item.price)) * 100)
        : 0;

    // Mini tab button helper
    const renderTabControls = () => {
        if (!item.isAvailable || !onUpdateQuantity) return null;

        return (
            <div className="mt-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {quantityInTab > 0 ? (
                    <div className="inline-flex items-center gap-1 bg-amber-500/20 dark:bg-amber-500/30 border border-amber-500/40 rounded-xl p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(-1);
                            }}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs active:scale-90 transition-transform cursor-pointer"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>
                        <span className="w-4 sm:w-5 text-center text-xs font-black text-amber-700 dark:text-amber-400 tabular-nums">
                            {quantityInTab}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(1);
                            }}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs active:scale-90 transition-transform cursor-pointer"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateQuantity(1);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-100 hover:bg-amber-500 dark:bg-neutral-800 dark:hover:bg-amber-500 text-neutral-700 hover:text-slate-950 dark:text-neutral-300 dark:hover:text-slate-950 text-[11px] font-extrabold border border-neutral-200 dark:border-neutral-700 transition-all active:scale-90 cursor-pointer shadow-2xs"
                    >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>{isAm ? 'ጨምር' : 'Add'}</span>
                    </button>
                )}
            </div>
        );
    };

    /* ── MINIMAL STYLE: Sleek Horizontal Row ── */
    if (menuStyle === 'MINIMAL') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-white dark:bg-neutral-900/95 rounded-2xl group transition-all duration-200",
                    "border shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] text-left",
                    item.isFeatured
                        ? "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-50/15 dark:bg-amber-950/10"
                        : "border-neutral-200/80 dark:border-neutral-800/80",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {hasImage ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-800 relative">
                        <DishImage
                            src={item.imageUrl}
                            alt={name}
                            className="transition-transform duration-300 group-hover:scale-105"
                        />
                        {item.isFeatured && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-white text-[7px] sm:text-[8px] px-1 py-0.2 rounded font-bold uppercase z-10">
                                ⭐
                            </span>
                        )}
                    </div>
                ) : null}

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={cn("text-xs sm:text-sm font-bold text-neutral-900 dark:text-[#F5F5F5] truncate", isAm && 'font-ethiopic font-bold')}>
                            <HighlightText text={name} highlight={searchQuery} />
                        </h3>
                        {hasDiscount && (
                            <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                            </span>
                        )}
                    </div>
                    {desc && (
                        <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5", isAm && "font-ethiopic")}>
                            <HighlightText text={desc} highlight={searchQuery} />
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end shrink-0 pl-1">
                    {hasDiscount ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                {discountPriceFormatted}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold line-through text-neutral-400 dark:text-neutral-500 mt-0.5">
                                {regularPriceFormatted}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs sm:text-base font-black text-amber-600 dark:text-amber-400 leading-none" style={{ color: 'var(--color-accent-500, var(--color-brand-500, #D97706))' }}>
                            {regularPriceFormatted}
                        </span>
                    )}
                    {!item.isAvailable ? (
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider mt-1", isAm && 'font-ethiopic')}>
                            {t('public.sold_out')}
                        </span>
                    ) : (
                        renderTabControls()
                    )}
                </div>
            </button>
        );
    }

    /* ── ELEGANT STYLE: Editorial Luxury Cards ── */
    if (menuStyle === 'ELEGANT') {
        const elegantFontClass = 'font-serif';
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full h-full text-left bg-white dark:bg-neutral-900/90 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-none group flex flex-col border",
                    item.isFeatured
                        ? "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 shadow-md"
                        : "border-neutral-200/80 dark:border-[#2A2A2A]",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {hasImage ? (
                    <div className="w-full aspect-[16/10] bg-neutral-100 dark:bg-[#111111] relative overflow-hidden shrink-0">
                        <DishImage src={item.imageUrl} alt={name} className="transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 dark:opacity-20 flex-none pointer-events-none" />

                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 pr-8 z-10">
                            {item.isFeatured && (
                                <div className={cn("bg-amber-500 text-white text-[8px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" /> {t('public.featured')}
                                </div>
                            )}
                            {hasDiscount && (
                                <div className={cn("bg-emerald-600 text-white text-[8px] sm:text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-md uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                    <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                <div className="p-4 sm:p-5 flex flex-col flex-grow">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <h3 className={cn("text-sm sm:text-lg font-bold text-neutral-900 dark:text-[#F5F5F5] leading-tight", elegantFontClass, isAm && 'font-ethiopic font-bold')}>
                            <HighlightText text={name} highlight={searchQuery} />
                        </h3>
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 shrink-0">
                                <span className={cn("text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400", elegantFontClass)}>
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-[10px] sm:text-xs font-medium line-through text-neutral-400 dark:text-[#A3A3A3]">
                                    {regularPriceFormatted}
                                </span>
                            </div>
                        ) : (
                            <p className={cn("text-sm sm:text-lg font-bold text-amber-600 dark:text-amber-400 shrink-0", elegantFontClass)} style={{ color: 'var(--color-accent-500, var(--color-brand-500, #D97706))' }}>
                                {regularPriceFormatted}
                            </p>
                        )}
                    </div>

                    {desc && (
                        <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-[#A3A3A3] line-clamp-2 leading-relaxed mb-2", elegantFontClass, isAm && "font-ethiopic")}>
                            <HighlightText text={desc} highlight={searchQuery} />
                        </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between">
                        {!item.isAvailable ? (
                            <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                {t('public.sold_out')}
                            </span>
                        ) : (
                            renderTabControls()
                        )}
                    </div>
                </div>
            </button>
        );
    }

    /* ── MODERN STYLE: Side-by-Side Card (Large Left Photo + Right Details) ── */
    if (menuStyle === 'MODERN') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "w-full h-full bg-white dark:bg-[#1A1A1A] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left transition-all duration-300",
                    "border shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group",
                    "flex items-stretch gap-3.5 sm:gap-4.5 overflow-hidden",
                    item.isFeatured
                        ? "border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-50/15 dark:bg-amber-950/10"
                        : "border-neutral-200/80 dark:border-neutral-800/80",
                    !item.isAvailable && "opacity-60 grayscale-[50%]"
                )}
            >
                {/* Left Side: Large Rounded Food Photo */}
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 relative bg-neutral-100 dark:bg-neutral-800">
                    {hasImage ? (
                        <DishImage
                            src={item.imageUrl}
                            alt={name}
                            className="transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <span className="text-3xl filter drop-shadow-sm">🍽️</span>
                        </div>
                    )}

                    {/* Badges */}
                    {item.isFeatured && (
                        <span className={cn("absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm z-10", isAm && 'font-ethiopic')}>
                            ⭐ {t('public.featured')}
                        </span>
                    )}
                    {hasDiscount && (
                        <span className={cn("absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-md uppercase tracking-wider z-10", isAm && 'font-ethiopic')}>
                            {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                        </span>
                    )}
                </div>

                {/* Right Side: Title, Description, Price & Order Action */}
                <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                    <div>
                        <h3 className={cn("text-sm sm:text-base font-bold text-neutral-900 dark:text-[#F5F5F5] leading-snug line-clamp-2", isAm && 'font-ethiopic font-bold')}>
                            <HighlightText text={name} highlight={searchQuery} />
                        </h3>

                        {desc && (
                            <p className={cn("text-xs text-neutral-500 dark:text-[#A3A3A3] line-clamp-2 sm:line-clamp-3 leading-relaxed mt-1 sm:mt-1.5", isAm && "font-ethiopic")}>
                                <HighlightText text={desc} highlight={searchQuery} />
                            </p>
                        )}
                    </div>

                    <div className="mt-2.5 pt-1.5 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
                        {hasDiscount ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                                    {discountPriceFormatted}
                                </span>
                                <span className="text-[11px] sm:text-xs font-bold line-through text-neutral-400 dark:text-neutral-500">
                                    {regularPriceFormatted}
                                </span>
                            </div>
                        ) : (
                            <p className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400" style={{ color: 'var(--color-accent-500, var(--color-brand-500, #D97706))' }}>
                                {regularPriceFormatted}
                            </p>
                        )}

                        {!item.isAvailable ? (
                            <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider", isAm && 'font-ethiopic')}>
                                {t('public.sold_out')}
                            </span>
                        ) : (
                            renderTabControls()
                        )}
                    </div>
                </div>
            </button>
        );
    }

    /* ── CLASSIC STYLE (DEFAULT): Multi-grid with Rectangular Cards ── */
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
                    <DishImage
                        src={item.imageUrl}
                        alt={name}
                        className="transition-transform duration-500 group-hover:scale-105"
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
                    <HighlightText text={name} highlight={searchQuery} />
                </h3>

                {desc && (
                    <p className={cn("text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-2 leading-snug w-full", isAm && "font-ethiopic")}>
                        <HighlightText text={desc} highlight={searchQuery} />
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
                        <p className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400 leading-none" style={{ color: 'var(--color-accent-500, var(--color-brand-500, #D97706))' }}>
                            {regularPriceFormatted}
                        </p>
                    )}
                    {!item.isAvailable ? (
                        <span className={cn("text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] rounded uppercase tracking-wider", isAm && 'font-ethiopic')}>
                            {t('public.sold_out')}
                        </span>
                    ) : (
                        renderTabControls()
                    )}
                </div>
            </div>
        </button>
    );
};
