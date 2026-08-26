import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, List, Palette, Settings, LogOut, ExternalLink, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
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
        { to: '/dashboard/categories', icon: List, labelKey: 'nav.categories', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
        { to: '/dashboard/restaurant', icon: Store, labelKey: 'nav.restaurant', color: 'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]', bg: 'bg-[color:var(--color-brand-50)] border border-[color:var(--color-brand-100)] dark:bg-[color:var(--color-brand-500)]/10 dark:border-[color:var(--color-brand-500)]/20' },
        { to: '/dashboard/customize', icon: Palette, labelKey: 'nav.customize', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20' },
        { to: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] pb-12 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 dark:from-neutral-950 dark:via-neutral-900/95 dark:to-neutral-900 transition-colors duration-200 lg:hidden">

            {/* Header */}
            <div className="animate-fade-in-up delay-0 px-5 pt-8 pb-4">
                <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
                    {t('nav.more')}
                </h1>
            </div>

            <div className="flex-1 px-4 space-y-4 max-w-md mx-auto w-full">
                {/* Profile Widget */}
                <div className="animate-fade-in-up delay-75 backdrop-blur-md bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center gap-4">
                    {restaurant?.logoUrl ? (
                        <img src={restaurant.logoUrl} alt={restaurant.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-[color:var(--color-brand-500)]/20 p-0.5" />
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-[color:var(--color-brand-400)] to-[color:var(--color-brand-600)] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-[color:var(--color-brand-500)]/20 p-0.5 shadow-sm">
                            <span className="text-white font-bold text-2xl">{restaurant?.name?.[0]}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50 truncate">{restaurant?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                'text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block shadow-sm transition-colors',
                                restaurant?.status === 'PUBLISHED'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                            )}>
                                {restaurant?.status === 'PUBLISHED' ? t('status.published') : t('status.draft')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-3 pt-2">
                    {links.map((link, index) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            style={{ animationDelay: `${(index * 50) + 150}ms` }}
                            className="animate-fade-in-up block backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/90 rounded-[16px] p-4 hover:-translate-x-1 hover:shadow-md dark:hover:shadow-neutral-950/50 transition-all duration-200 active:scale-95 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", link.bg)}>
                                    <link.icon className={cn("w-5 h-5 transition-colors", link.color)} />
                                </div>
                                <span className="flex-1 font-bold text-[15px] text-neutral-800 dark:text-neutral-200 tracking-tight group-hover:text-neutral-900 dark:group-hover:text-neutral-50">{t(link.labelKey)}</span>
                                <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                            </div>
                        </NavLink>
                    ))}
                </div>

                {/* External Action Links */}
                <div className="space-y-3 pt-4">
                    {restaurant && (
                        <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ animationDelay: `${(links.length * 50) + 150}ms` }}
                            className="animate-fade-in-up block backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/90 rounded-[16px] p-4 hover:-translate-x-1 hover:shadow-md dark:hover:shadow-neutral-950/50 transition-all duration-200 active:scale-95 group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                                    <ExternalLink className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="flex-1 font-bold text-[15px] text-neutral-800 dark:text-neutral-200 tracking-tight group-hover:text-neutral-900 dark:group-hover:text-neutral-50">{t('nav.viewMenu')}</span>
                                <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                            </div>
                        </a>
                    )}

                    <div
                        className="animate-fade-in-up border-t border-neutral-200/60 dark:border-neutral-800/60 my-2 pt-2"
                        style={{ animationDelay: `${(links.length * 50) + 200}ms` }}
                    />

                    <button
                        onClick={handleLogout}
                        style={{ animationDelay: `${(links.length * 50) + 250}ms` }}
                        className="animate-fade-in-up w-full backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800/90 rounded-[16px] p-4 hover:-translate-x-1 hover:shadow-md hover:border-red-200/80 hover:bg-red-50 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 active:scale-95 text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
                                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="flex-1 font-bold text-[15px] text-red-600 dark:text-red-400 tracking-tight">{t('auth.logout')}</span>
                            <ChevronRight className="w-5 h-5 text-red-300 dark:text-red-600/50 group-hover:text-red-500 transition-colors" />
                        </div>
                    </button>
                </div>

                <div
                    className="text-center px-4 py-8 animate-fade-in-up"
                    style={{ animationDelay: `${(links.length * 50) + 300}ms` }}
                >
                    <p className="text-[12px] font-medium text-neutral-400 dark:text-neutral-500">{t('dashboard.logged_in_as')} {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default MorePage;
