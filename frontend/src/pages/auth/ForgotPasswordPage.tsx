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
                <title>{t('auth.forgot.title', { defaultValue: 'Reset your password' })} — OurMenu</title>
            </Helmet>

            <div className="min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between transition-colors duration-200">
                {/* Subtle Ambient Radial Glow */}
                <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.18),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(0,0,0,0))] blur-3xl opacity-75" />

                {/* Top Utility Header - Corner to Corner */}
                <header className="relative z-10 w-full px-6 sm:px-10 lg:px-12 py-5 sm:py-6 flex items-center justify-between">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-3 text-neutral-900 dark:text-neutral-100 font-bold text-xl tracking-tight hover:opacity-85 transition-opacity"
                    >
                        <img
                            src="/logo.png"
                            alt="OurMenu"
                            className="w-10 h-10 rounded-xl shadow-md shadow-amber-500/20 object-contain"
                        />
                        <span className="text-xl font-bold tracking-tight">OurMenu</span>
                    </Link>

                    {/* Controls: Language & Theme */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={toggleLanguage}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm cursor-pointer"
                        >
                            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                            <span>{i18n.language === 'am' ? 'English' : 'አማርኛ'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm cursor-pointer"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-neutral-600" />}
                        </button>
                    </div>
                </header>

                {/* Main Card Content */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 w-full my-auto">
                    <div className="w-full max-w-[440px] sm:max-w-[460px] bg-white/90 dark:bg-neutral-900/85 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xl shadow-neutral-950/5 dark:shadow-black/40 transition-all duration-200">
                        <ForgotPasswordWizard
                            initialEmail={initialEmail}
                            onBackToLogin={() => navigate('/login')}
                            onSuccess={(resetEmail) => {
                                navigate(`/login?email=${encodeURIComponent(resetEmail)}`);
                            }}
                        />
                    </div>
                </main>

                {/* Footer - Corner to Corner */}
                <footer className="relative z-10 w-full px-6 sm:px-10 lg:px-12 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 dark:text-neutral-500">
                    <div>
                        &copy; {new Date().getFullYear()} OurMenu. All rights reserved.
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/terms" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/privacy" className="hover:text-amber-600 dark:hover:text-amber-500 transition-colors">Privacy Policy</Link>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
