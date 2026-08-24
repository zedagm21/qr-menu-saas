import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Dashboard pages
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const RestaurantPage = lazy(() => import('./pages/dashboard/RestaurantPage'));
const CategoriesPage = lazy(() => import('./pages/dashboard/CategoriesPage'));
const MenuItemsPage = lazy(() => import('./pages/dashboard/MenuItemsPage'));
const QRPage = lazy(() => import('./pages/dashboard/QRPage'));
const CustomizePage = lazy(() => import('./pages/dashboard/CustomizePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const MorePage = lazy(() => import('./pages/dashboard/MorePage'));

// Public
const PublicMenuPage = lazy(() => import('./pages/public/PublicMenuPage'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin border-[3px]" />
    </div>
);

const App: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            {/* Public */}
            <Route path="/r/:slug" element={<PublicMenuPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="restaurant" element={<RestaurantPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="menu" element={<MenuItemsPage />} />
                <Route path="qr" element={<QRPage />} />
                <Route path="customize" element={<CustomizePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="more" element={<MorePage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Suspense>
);

export default App;
