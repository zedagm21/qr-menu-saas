import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Store, List, UtensilsCrossed,
    QrCode, Palette, Settings, LogOut, ChevronLeft,
    ChevronRight, ExternalLink, BarChart3, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.overview', end: true },
    { to: '/dashboard/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
    { to: '/dashboard/restaurant', icon: Store, labelKey: 'nav.restaurant' },
    { to: '/dashboard/categories', icon: List, labelKey: 'nav.categories' },
    { to: '/dashboard/menu', icon: UtensilsCrossed, labelKey: 'nav.menu' },
    { to: '/dashboard/qr', icon: QrCode, labelKey: 'nav.qr' },
    { to: '/dashboard/customize', icon: Palette, labelKey: 'nav.customize' },
    { to: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings' },
];

export const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const { user, restaurant, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleConfirmLogout = async () => {
        await logout();
        navigate('/login');
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={cn('flex items-center px-4 h-16 border-b border-neutral-100 dark:border-neutral-800', collapsed ? 'justify-center' : 'justify-between')}>
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[color:var(--color-brand-500)] rounded-lg flex items-center justify-center text-white">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-50 text-sm">{t('nav.menuQr', { defaultValue: 'MenuQR' })}</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-7 h-7 bg-[color:var(--color-brand-500)] rounded-lg flex items-center justify-center text-white">
                        <QrCode className="w-4 h-4" />
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Restaurant Info Card */}
            {!collapsed && restaurant && (
                <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                        {restaurant.logoUrl ? (
                            <img
                                src={restaurant.logoUrl}
                                alt={restaurant.name}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0 ring-2 ring-[color:var(--color-brand-500)]/20"
                            />
                        ) : (
                            <div className="w-8 h-8 bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 rounded-lg flex items-center justify-center flex-shrink-0 ring-2 ring-[color:var(--color-brand-500)]/20">
                                <span className="text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] font-bold text-xs">{restaurant.name[0]}</span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{restaurant.name}</p>
                            <span className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                restaurant.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                            )}>
                                {restaurant.status === 'PUBLISHED' ? t('status.published') : t('status.draft')}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, labelKey, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            cn(
                                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150',
                                collapsed ? 'justify-center' : '',
                                isActive
                                    ? 'bg-gradient-to-r from-[color:var(--color-brand-50)] to-transparent dark:from-[color:var(--color-brand-500)]/10 dark:to-transparent border-l-[3px] border-[color:var(--color-brand-500)] text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] font-semibold rounded-r-lg'
                                    : 'text-neutral-600 font-medium dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-50 rounded-lg'
                            )
                        }
                        title={collapsed ? t(labelKey) : undefined}
                    >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                        {!collapsed && <span>{t(labelKey)}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Platform Admin Switcher */}
            {user?.role === 'ADMIN' && (
                <div className={cn('px-3 pb-2', collapsed && 'flex justify-center')}>
                    <NavLink
                        to="/admin"
                        className={cn(
                            'group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all',
                            'text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs',
                            collapsed && 'justify-center'
                        )}
                        title={collapsed ? t('nav.admin_panel', { defaultValue: 'Platform Admin' }) : undefined}
                    >
                        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                        {!collapsed && <span>{t('nav.admin_panel', { defaultValue: 'Platform Admin' })}</span>}
                    </NavLink>
                </div>
            )}

            {/* View Menu button */}
            {restaurant && (
                <div className={cn('px-3 pb-2', collapsed && 'flex justify-center')}>
                    <a
                        href={`/r/${restaurant.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            'group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold',
                            'text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 hover:bg-[color:var(--color-brand-100)] dark:hover:bg-[color:var(--color-brand-500)]/20 transition-colors border border-[color:var(--color-brand-200)] dark:border-[color:var(--color-brand-500)]/20',
                            collapsed && 'justify-center'
                        )}
                        title={collapsed ? t('nav.viewMenu') : undefined}
                    >
                        <ExternalLink className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        {!collapsed && t('nav.viewMenu')}
                    </a>
                </div>
            )}

            {/* User / Logout */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-3 py-3">
                {!collapsed && (
                    <div className="px-2 py-1 mb-1">
                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">{user?.name}</p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">{user?.email}</p>
                    </div>
                )}
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors',
                        collapsed && 'justify-center'
                    )}
                    title={collapsed ? t('auth.logout') : undefined}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && t('auth.logout')}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className={cn(
                'hidden lg:flex flex-col bg-white dark:bg-neutral-950 border-r border-neutral-100 dark:border-neutral-800 transition-all duration-300 flex-shrink-0 h-full',
                'shadow-[1px_0_20px_rgba(0,0,0,0.04)] dark:shadow-[1px_0_20px_rgba(0,0,0,0.4)]',
                collapsed ? 'w-16' : 'w-56'
            )}>
                {sidebarContent}
            </div>
            {showLogoutConfirm && (
                <ConfirmDialog
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={handleConfirmLogout}
                    title={t('actions.signOut')}
                    description={t('actions.signOutDesc')}
                    confirmText={t('auth.logout')}
                    cancelText={t('common.cancel')}
                    isDestructive={true}
                />
            )}
        </>
    );
};
