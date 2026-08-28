import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { QrCode, Eye, EyeOff, Mail, Lock, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { Button } from '../../components/ui/Button';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { ForgotPasswordWizard } from '../../components/auth/ForgotPasswordWizard';
import toast from 'react-hot-toast';

interface FormData {
    email: string;
    password: string;
}

const LoginPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { login, googleAuth } = useAuth();
    const { theme, setTheme } = useDashboardTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialMode = searchParams.get('mode') === 'forgot' ? 'forgot' : 'login';
    const initialEmail = searchParams.get('email') || '';

    const [authMode, setAuthMode] = useState<'login' | 'forgot'>(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const schema = useMemo(() => z.object({
        email: z.string().email(t('auth.validation.invalid_email')),
        password: z.string().min(1, t('auth.validation.password_required')),
    }), [t]);

    const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: initialEmail,
            password: '',
        },
    });

    useEffect(() => {
        if (initialEmail) {
            setValue('email', initialEmail);
        }
    }, [initialEmail, setValue]);

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'am' ? 'en' : 'am';
        i18n.changeLanguage(nextLang);
    };

    const toggleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else setTheme('dark');
    };

    const isDarkMode = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const onSubmit = async (data: FormData) => {
        setApiError('');
        try {
            const result = await login(data.email, data.password);
            if (result?.user?.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            const resData = err?.response?.data;
            if (resData?.error === 'EMAIL_NOT_VERIFIED') {
                const unverifiedEmail = resData?.data?.email || data.email;
                toast.error(t('auth.verify.please_verify_toast', { defaultValue: 'Please verify your email before signing in.' }));
                navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
                return;
            }
            setApiError(resData?.error || t('errors.generic', { defaultValue: 'Invalid email or password' }));
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setIsGoogleLoading(true);
        setApiError('');
        try {
            const result = await googleAuth(credential);
            if (result?.user?.role === 'ADMIN') {
                navigate('/admin');
            } else if (result.isNewUser) {
                toast.success(t('auth.google_welcome_new', { defaultValue: 'Welcome! Complete your restaurant profile.' }));
                navigate('/dashboard/restaurant');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setApiError(err?.response?.data?.error || t('errors.generic', { defaultValue: 'Google sign in failed.' }));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>{authMode === 'login' ? t('auth.loginTitle') : t('auth.forgot.title', { defaultValue: 'Reset your password' })} — QR Menu</title>
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

                {/* Main Auth Container */}
                <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
                    <div className="w-full max-w-md">
                        {authMode === 'login' ? (
                            <>
                                {/* Heading */}
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-13 h-13 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-2xl shadow-lg shadow-amber-500/25 mb-3 text-white">
                                        <QrCode className="w-6 h-6" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                        {t('auth.loginTitle')}
                                    </h1>
                                    <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-[14px]">
                                        {t('auth.loginSubtitle')}
                                    </p>
                                </div>

                                {/* Login Card */}
                                <div className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-neutral-950/5 dark:shadow-black/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 transition-all duration-200">
                                    {apiError && (
                                        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fade-in">
                                            <span className="shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full bg-red-500" />
                                            <span className="flex-1 text-[13.5px] leading-relaxed">{apiError}</span>
                                        </div>
                                    )}

                                    {/* Google Auth Button */}
                                    <div className="space-y-4">
                                        <GoogleAuthButton
                                            onSuccess={handleGoogleSuccess}
                                            onError={(err) => setApiError(err || 'Google sign in failed')}
                                            isLoading={isGoogleLoading}
                                            text="continue_with"
                                        />

                                        {/* Divider */}
                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500">
                                                    {t('auth.or_continue_with', { defaultValue: 'Or continue with email' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Email / Password Form */}
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                                                    {t('auth.email')}
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        {...register('email')}
                                                        type="email"
                                                        autoComplete="email"
                                                        className={`w-full h-12 pl-10 pr-4 rounded-xl border bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:ring-2 ${
                                                            errors.email
                                                                ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500'
                                                                : 'border-neutral-200 dark:border-neutral-700 focus:ring-amber-500/20 focus:border-amber-500'
                                                        }`}
                                                        placeholder={t('auth.ph_email')}
                                                    />
                                                </div>
                                                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                        {t('auth.password')}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAuthMode('forgot');
                                                            setApiError('');
                                                        }}
                                                        className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                                                    >
                                                        {t('auth.forgotPassword', { defaultValue: 'Forgot password?' })}
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        {...register('password')}
                                                        type={showPassword ? 'text' : 'password'}
                                                        autoComplete="current-password"
                                                        className={`w-full h-12 pl-10 pr-11 rounded-xl border bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:ring-2 ${
                                                            errors.password
                                                                ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500'
                                                                : 'border-neutral-200 dark:border-neutral-700 focus:ring-amber-500/20 focus:border-amber-500'
                                                        }`}
                                                        placeholder={t('auth.ph_password')}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                                                        onClick={() => setShowPassword(s => !s)}
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
                                            </div>

                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20"
                                                    size="lg"
                                                    isLoading={isSubmitting}
                                                >
                                                    {t('auth.loginCta')}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Bottom Link: No account */}
                                <p className="text-center mt-6 text-sm text-neutral-500 dark:text-neutral-400">
                                    {t('auth.noAccount')}{' '}
                                    <Link to="/register" className="text-amber-600 dark:text-amber-500 font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                                        {t('auth.signUpFree')}
                                    </Link>
                                </p>
                            </>
                        ) : (
                            /* In-Card Forgot Password Wizard */
                            <div className="bg-white/95 dark:bg-neutral-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-neutral-950/5 dark:shadow-black/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 transition-all duration-200">
                                <ForgotPasswordWizard
                                    initialEmail={getValues('email')}
                                    onBackToLogin={() => {
                                        setAuthMode('login');
                                        setApiError('');
                                    }}
                                    onSuccess={(resetEmail) => {
                                        setValue('email', resetEmail);
                                        setAuthMode('login');
                                    }}
                                />
                            </div>
                        )}
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

export default LoginPage;
