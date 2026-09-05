import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

// Dashboard pages
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const RestaurantPage = lazy(() => import('./pages/dashboard/RestaurantPage'));
const CategoriesPage = lazy(() => import('./pages/dashboard/CategoriesPage'));
const MenuItemsPage = lazy(() => import('./pages/dashboard/MenuItemsPage'));
const QRPage = lazy(() => import('./pages/dashboard/QRPage'));
const CustomizePage = lazy(() => import('./pages/dashboard/CustomizePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const MorePage = lazy(() => import('./pages/dashboard/MorePage'));

// Admin pages & layouts
const AdminRoute = lazy(() => import('./components/auth/AdminRoute').then(m => ({ default: m.AdminRoute })));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'));
const AdminRestaurantsPage = lazy(() => import('./pages/admin/AdminRestaurantsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivityPage'));

// Public
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PublicMenuPage = lazy(() => import('./pages/public/PublicMenuPage'));
const CameraUploadPage = lazy(() => import('./pages/public/CameraUploadPage'));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin border-[3px]" />
    </div>
);

const App: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            {/* Public */}
            <Route path="/r/:slug" element={<PublicMenuPage />} />
            <Route path="/camera-upload" element={<CameraUploadPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ForgotPasswordPage />} />

            {/* Restaurant Owner Dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="restaurant" element={<RestaurantPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="menu" element={<MenuItemsPage />} />
                <Route path="qr" element={<QRPage />} />
                <Route path="customize" element={<CustomizePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="more" element={<MorePage />} />
            </Route>

            {/* Platform Super Admin */}
            <Route path="/admin" element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminOverviewPage />} />
                    <Route path="restaurants" element={<AdminRestaurantsPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="activity" element={<AdminActivityPage />} />
                </Route>
            </Route>

            {/* Landing page kept accessible for preview/testing */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/demo" element={<Navigate to="/r/vista-cafe-restaurant" replace />} />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </Suspense>
);

export default App;
