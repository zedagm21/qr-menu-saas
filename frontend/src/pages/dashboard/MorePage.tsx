import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, List, Palette, Settings, LogOut, ExternalLink, ChevronRight, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { InstallAppBanner } from '../../components/ui/InstallAppBanner';
import { cn } from '../../lib/utils';

const MorePage: React.FC = () => {
    const { t } = useTranslation();
    const { user, restaurant, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const links = [
        { to: '/dashboard/categories', icon: List, labelKey: 'nav.categories', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/15' },
        { to: '/dashboard/restaurant', icon: Store, labelKey: 'nav.restaurant', color: 'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]', bg: 'bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/15' },
        { to: '/dashboard/customize', icon: Palette, labelKey: 'nav.customize', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15' },
        { to: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
        ...(user?.role === 'ADMIN' ? [
            { to: '/admin', icon: ShieldCheck, labelKey: 'nav.admin_panel', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/15' },
        ] : []),
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] pb-12 bg-neutral-50/50 dark:bg-transparent transition-colors duration-200 lg:hidden">

            <div className="flex-1 px-3.5 py-4 space-y-3.5 max-w-md mx-auto w-full">
                {/* PWA Install Banner */}
                <InstallAppBanner />

                {/* Profile Widget - Compact Native Style */}
                <div className="animate-fade-in-up delay-75 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                    {restaurant?.logoUrl ? (
                        <img
                            src={restaurant.logoUrl}
                            alt={restaurant.name}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-1 ring-[color:var(--color-brand-500)]/20"
                        />
                    ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-brand-600)] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                            <span className="text-white font-bold text-base">{restaurant?.name?.[0] || '🍽️'}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">{restaurant?.name || t('nav.menuQr')}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                                restaurant?.status === 'PUBLISHED'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                            )}>
                                <span className={cn('w-1.5 h-1.5 rounded-full', restaurant?.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                <span>{restaurant?.status === 'PUBLISHED' ? t('status.published') : t('status.draft')}</span>
                            </span>
                        </div>
                    </div>
                    {restaurant?.slug && (
                        <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-[color:var(--color-brand-600)] transition-colors active:scale-95 shrink-0"
                            title={t('nav.viewMenu')}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Navigation Links - Inset Grouped Table */}
                <div className="animate-fade-in-up delay-150 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/80 shadow-xs">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-3 px-3.5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors select-none group"
                        >
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors", link.bg)}>
                                <link.icon className={cn("w-4 h-4", link.color)} />
                            </div>
                            <span className="flex-1 text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight group-hover:text-neutral-900 dark:group-hover:text-neutral-50">{t(link.labelKey)}</span>
                            <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 transition-colors" />
                        </NavLink>
                    ))}
                </div>

                {/* Sign Out Group */}
                <div className="animate-fade-in-up delay-225 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800/90 rounded-2xl overflow-hidden shadow-xs">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-red-50/70 dark:hover:bg-red-500/10 active:bg-red-100/80 dark:active:bg-red-500/20 transition-colors select-none group cursor-pointer"
                    >
                        <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="flex-1 text-[13px] font-bold text-red-600 dark:text-red-400 tracking-tight">{t('auth.logout')}</span>
                        <ChevronRight className="w-4 h-4 text-red-300 dark:text-red-600/50 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="text-center px-4 pt-4 pb-8">
                    <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{t('dashboard.logged_in_as')} {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default MorePage;
