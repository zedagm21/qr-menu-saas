import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { cn } from '../../lib/utils';

export const MobileTopBar: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { restaurant: authRestaurant } = useAuth();
    const { data: liveRestaurant } = useRestaurant();
    const { theme, setTheme } = useDashboardTheme();

    const restaurant = liveRestaurant || authRestaurant;

    // Sub-route definitions
    const subRouteTitles: Record<string, string> = {
        '/dashboard/categories': t('nav.categories', { defaultValue: 'Categories' }),
        '/dashboard/restaurant': t('nav.restaurant', { defaultValue: 'Restaurant Profile' }),
        '/dashboard/customize': t('nav.customize', { defaultValue: 'Appearance' }),
        '/dashboard/settings': t('nav.settings', { defaultValue: 'Settings' }),
    };

    const currentSubTitle = subRouteTitles[location.pathname];
    const isSubRoute = Boolean(currentSubTitle);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard/more');
        }
    };

    const toggleTheme = () => {
        const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <header className="lg:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 pt-safe transition-colors duration-200">
            <div className="h-12 px-3.5 flex items-center justify-between gap-2.5">
                {isSubRoute ? (
                    /* ── Sub-route Mode: Back Button + Title ── */
                    <>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-1 text-[13px] font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white active:scale-95 transition-all -ml-1.5 p-1.5 rounded-lg cursor-pointer"
                            aria-label={t('common.back', { defaultValue: 'Back' })}
                        >
                            <ChevronLeft className="w-5 h-5 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] stroke-[2.5]" />
                            <span className="leading-none">{t('common.back', { defaultValue: 'Back' })}</span>
                        </button>

                        <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-neutral-50 truncate text-center flex-1">
                            {currentSubTitle}
                        </h2>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            <Sun className="w-4 h-4 hidden dark:block text-amber-400" />
                            <Moon className="w-4 h-4 block dark:hidden text-neutral-600" />
                        </button>
                    </>
                ) : (
                    /* ── Root Mode: Restaurant Icon/Profile Link + Theme Toggle ── */
                    <>
                        <Link
                            to="/dashboard/restaurant"
                            className="flex items-center gap-2 min-w-0 flex-1 group active:opacity-75 transition-opacity"
                            title={t('nav.restaurant', { defaultValue: 'Restaurant Profile' })}
                        >
                            {restaurant?.logoUrl ? (
                                <img
                                    src={restaurant.logoUrl}
                                    alt={restaurant.name || 'Restaurant'}
                                    className="w-7 h-7 rounded-lg object-cover flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-[color:var(--color-brand-500)] transition-all"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-lg bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/20 text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)] font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                    {(restaurant?.name && restaurant.name[0]) || '🍽️'}
                                </div>
                            )}
                            <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-[color:var(--color-brand-600)] dark:group-hover:text-[color:var(--color-brand-400)] transition-colors">
                                {restaurant?.name || t('nav.menuQr', { defaultValue: 'OurMenu' })}
                            </span>
                        </Link>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                aria-label="Toggle theme"
                            >
                                <Sun className="w-4 h-4 hidden dark:block text-amber-400" />
                                <Moon className="w-4 h-4 block dark:hidden text-neutral-600" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};
