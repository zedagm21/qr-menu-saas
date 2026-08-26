import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const DashboardLayout: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated, isLoading } = useAuth();

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
            <main className="flex-1 overflow-y-auto pb-[64px] lg:pb-0 bg-neutral-50/50 dark:bg-neutral-900/50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto min-h-full">
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
