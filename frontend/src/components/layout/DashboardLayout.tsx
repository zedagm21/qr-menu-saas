import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const DashboardLayout: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated, isLoading, restaurant, user } = useAuth();
    const navigate = useNavigate();

    const [impersonatingName, setImpersonatingName] = useState<string | null>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('admin_impersonating_restaurant_name');
        if (storedName) {
            setImpersonatingName(storedName);
        }
    }, []);

    const handleExitImpersonation = () => {
        localStorage.removeItem('admin_impersonating_restaurant_id');
        localStorage.removeItem('admin_impersonating_restaurant_name');
        setImpersonatingName(null);
        navigate('/admin/restaurants');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    {/* Brand-colored ring spinner */}
                    <div className="w-11 h-11 border-4 border-[color:var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                    {/* Pulse loading text */}
                    <p className="text-[13px] text-neutral-400 font-semibold tracking-wide uppercase animate-pulse">
                        {t('dashboard.loading_workspace')}
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="flex h-[100dvh] bg-[#fdfdfd] dark:bg-transparent overflow-hidden selection:bg-[color:var(--color-brand-50)] selection:text-[color:var(--color-brand-900)] dark:selection:bg-[color:var(--color-brand-500)]/30 dark:selection:text-[color:var(--color-brand-100)]">
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 overflow-y-auto pb-[64px] lg:pb-0 bg-neutral-50/50 dark:bg-neutral-900/50 transition-colors duration-200 flex flex-col">
                {/* Impersonation Banner for Super Admin */}
                {impersonatingName && (
                    <div className="bg-amber-400 text-amber-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-amber-500 animate-fade-in">
                        <div className="flex items-center gap-2 min-w-0">
                            <ShieldAlert className="w-4 h-4 text-amber-900 flex-shrink-0" />
                            <span className="truncate">
                                👑 Super Admin Mode: Viewing dashboard for <strong>"{impersonatingName}"</strong>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleExitImpersonation}
                            className="px-3 py-1 rounded-lg bg-amber-950 text-amber-100 hover:bg-black text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Exit to Admin</span>
                        </button>
                    </div>
                )}

                {/* Suspension Banner if restaurant is suspended */}
                {restaurant?.isSuspended && (
                    <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xs sticky top-0 z-30 border-b border-rose-700 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-200 flex-shrink-0" />
                            <div>
                                <span className="font-black uppercase tracking-wide">Account Suspended (Read-Only Mode): </span>
                                <span>{restaurant.suspensionReason || 'Modifications are locked by platform administrator. Diners currently see an unavailable notice.'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto min-h-full w-full flex-1">
                    {/* Smooth fade-in on page transitions */}
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

