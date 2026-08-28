import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { QrCode, Globe, Moon, Sun } from 'lucide-react';
import { ForgotPasswordWizard } from '../../components/auth/ForgotPasswordWizard';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';

const ForgotPasswordPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { theme, setTheme } = useDashboardTheme();

    const initialEmail = searchParams.get('email') || '';

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'am' ? 'en' : 'am';
        i18n.changeLanguage(nextLang);
    };

    const toggleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else setTheme('dark');
    };

    const isDarkMode = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <>
            <Helmet>
                <title>{t('auth.forgot.title', { defaultValue: 'Reset your password' })} — QR Menu</title>
            </Helmet>

            <div className="min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between transition-colors duration-200">
                {/* Subtle Ambient Radial Glow */}
                <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.18),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(0,0,0,0))] blur-3xl opacity-75" />

                {/* Top Utility Header */}
                <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2.5 text-neutral-900 dark:text-neutral-100 font-bold text-lg tracking-tight hover:opacity-85 transition-opacity"
                    >
                        <div className="w-9 h-9 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <span>QR Menu</span>
                    </Link>

                    {/* Controls: Language & Theme */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleLanguage}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm cursor-pointer"
                        >
                            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                            <span>{i18n.language === 'am' ? 'English' : 'አማርኛ'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm cursor-pointer"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-600" />}
                        </button>
                    </div>
                </header>

                {/* Main Card Content */}
                <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
                    <div className="w-full max-w-md bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-xl shadow-neutral-950/5 dark:shadow-black/40 transition-all duration-200">
                        <ForgotPasswordWizard
                            initialEmail={initialEmail}
                            onBackToLogin={() => navigate('/login')}
                            onSuccess={(resetEmail) => {
                                navigate(`/login?email=${encodeURIComponent(resetEmail)}`);
                            }}
                        />
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 py-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
                    &copy; {new Date().getFullYear()} QR Menu SaaS. All rights reserved.
                </footer>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
