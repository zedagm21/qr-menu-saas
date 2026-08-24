import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, UtensilsCrossed, QrCode, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();

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
        { to: '/dashboard/more', icon: Menu, labelKey: 'nav.more', isActive: isMoreActive }
    ];

    return (
        <nav className={cn(
            'lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe selection:bg-transparent',
            'bg-white/90 dark:bg-neutral-950/90 backdrop-blur-lg border-t border-white/20 dark:border-neutral-800/80',
            'shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]'
        )}>
            <div className="flex items-center justify-around h-[64px] px-2">
                {navItems.map(({ to, icon: Icon, labelKey, end, isActive: forceActive }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center w-full h-full min-w-[64px] min-h-[44px] gap-1',
                                'transition-colors duration-150 active:scale-95',
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
                                    <Icon
                                        className="w-5 h-5 sm:w-6 sm:h-6"
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    <span className={cn(
                                        'text-[10px] font-medium leading-none',
                                        active ? 'font-semibold' : ''
                                    )}>
                                        {t(labelKey)}
                                    </span>
                                </>
                            );
                        }}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
