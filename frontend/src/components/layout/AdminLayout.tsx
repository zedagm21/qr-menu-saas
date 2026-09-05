import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Store, Users, FileText,
    LogOut, ExternalLink, ShieldCheck, ArrowLeft,
    Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { cn } from '../../lib/utils';

const adminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/admin/restaurants', icon: Store, label: 'Restaurants & Access' },
    { to: '/admin/users', icon: Users, label: 'Users & Registrations' },
    { to: '/admin/activity', icon: FileText, label: 'Audit Log' },
];

export const AdminLayout: React.FC = () => {
    const { t } = useTranslation();
    const { user, restaurant, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleConfirmLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden selection:bg-indigo-500 selection:text-white">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">Super Admin</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Platform Control</span>
                        </div>
                    </div>
                </div>

                {/* Back to Restaurant Dashboard Link */}
                <div className="px-4 pt-4 pb-2">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-indigo-400" />
                        <span>{t('admin.back_to_restaurant', { defaultValue: 'Restaurant Dashboard' })}</span>
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {adminNavItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all',
                                    isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                                )
                            }
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / User */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
                            <p className="text-[11px] text-indigo-400 font-medium truncate">{user?.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                            Admin
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{t('auth.logout', { defaultValue: 'Sign Out' })}</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Topbar */}
                <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-sm text-white">OurMenu Admin</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </header>

                {/* Mobile Navigation Drawer */}
                {mobileOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm">
                        <div className="w-64 h-full bg-slate-900 p-4 flex flex-col">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <span className="font-black text-sm text-white">Super Admin Menu</span>
                                <button type="button" onClick={() => setMobileOpen(false)} className="text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="flex-1 py-4 space-y-1">
                                {adminNavItems.map(({ to, icon: Icon, label, end }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        end={end}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl',
                                                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                            )
                                        }
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{label}</span>
                                    </NavLink>
                                ))}
                            </nav>
                            <button
                                type="button"
                                onClick={() => { setMobileOpen(false); navigate('/dashboard'); }}
                                className="w-full flex items-center gap-2 p-3 text-xs font-bold text-slate-300 bg-slate-800 rounded-xl"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Restaurant Dashboard</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Logout Confirm */}
            {showLogoutConfirm && (
                <ConfirmDialog
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={handleConfirmLogout}
                    title={t('actions.signOut', { defaultValue: 'Sign Out' })}
                    description={t('actions.signOutDesc', { defaultValue: 'Are you sure you want to sign out from the Super Admin platform?' })}
                    confirmText={t('auth.logout', { defaultValue: 'Sign Out' })}
                    cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
                    isDestructive={true}
                />
            )}
        </div>
    );
};
