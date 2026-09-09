import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, UtensilsCrossed, QrCode, BarChart3, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { user, restaurant: authRestaurant } = useAuth();
    const { data: liveRestaurant } = useRestaurant();
    const restaurant = liveRestaurant || authRestaurant;
    const isSetupNeeded = user?.role !== 'ADMIN' && (!restaurant?.slug || !restaurant?.name?.trim());

    // Check if the current route is one of the 'More' routes
    const isMoreActive = [
        '/dashboard/categories',
        '/dashboard/restaurant',
        '/dashboard/customize',
        '/dashboard/settings'
    ].some(path => location.pathname.startsWith(path));

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.home', end: true },
        { to: '/dashboard/menu', icon: UtensilsCrossed, labelKey: 'nav.menu' },
        { to: '/dashboard/qr', icon: QrCode, labelKey: 'nav.qr' },
        { to: '/dashboard/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
        { to: isSetupNeeded ? '/dashboard/restaurant' : '/dashboard/more', icon: Menu, labelKey: 'nav.more', isActive: isMoreActive }
    ];

    return (
        <nav className={cn(
            'lg:hidden fixed bottom-0 left-0 right-0 z-50 selection:bg-transparent',
            'bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200/70 dark:border-neutral-800/80',
            'shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]',
            'pb-safe'
        )}>
            <div className="flex items-center justify-around h-[58px] px-1">
                {navItems.map(({ to, icon: Icon, labelKey, end, isActive: forceActive }) => {
                    const isLocked = isSetupNeeded && to !== '/dashboard/restaurant';
                    return (
                        <NavLink
                            key={to}
                            to={isLocked ? '/dashboard/restaurant' : to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    'flex flex-col items-center justify-center flex-1 min-w-0 h-full py-1 gap-1',
                                    'transition-all duration-150 active:scale-90 select-none cursor-pointer',
                                    isLocked && 'opacity-35',
                                    (isActive || forceActive)
                                        ? 'text-[color:var(--color-brand-600)] dark:text-[color:var(--color-brand-400)]'
                                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                )
                            }
                        >
                        {({ isActive }) => {
                            const active = isActive || forceActive;
                            return (
                                <>
                                    <div className={cn(
                                        'px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center',
                                        active
                                            ? 'bg-[color:var(--color-brand-500)]/12 dark:bg-[color:var(--color-brand-500)]/20 shadow-xs'
                                            : 'bg-transparent'
                                    )}>
                                        <Icon
                                            className="w-5 h-5"
                                            strokeWidth={active ? 2.5 : 2}
                                        />
                                    </div>
                                    <span className={cn(
                                        'text-[10px] font-medium leading-none tracking-tight truncate max-w-[56px] text-center',
                                        active ? 'font-bold text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-300)]' : ''
                                    )}>
                                        {t(labelKey)}
                                    </span>
                                </>
                            );
                        }}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};
