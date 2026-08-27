import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { QrCode, Eye, EyeOff, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import toast from 'react-hot-toast';

interface FormData {
    name: string;
    email: string;
    password: string;
}

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const { register: registerUser, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const schema = useMemo(() => z.object({
        name: z.string().min(2, t('auth.validation.name_min')),
        email: z.string().email(t('auth.validation.invalid_email')),
        password: z.string().min(8, t('auth.validation.password_min')),
    }), [t]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setApiError('');
        try {
            await registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
            });
            toast.success(t('auth.verify.code_sent_toast', { defaultValue: 'Verification code sent to your email!' }));
            navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } } };
            setApiError(e?.response?.data?.error || t('errors.generic'));
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setIsGoogleLoading(true);
        setApiError('');
        try {
            const result = await googleAuth(credential);
            if (result.isNewUser) {
                toast.success(t('auth.google_welcome_new', { defaultValue: 'Welcome! Complete your restaurant profile.' }));
                navigate('/dashboard/restaurant');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setApiError(err?.response?.data?.error || t('errors.generic', { defaultValue: 'Google sign up failed.' }));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>{t('auth.registerTitle')} — QR Menu</title>
            </Helmet>
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Logo & Heading */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 rounded-2xl shadow-[0_2px_8px_rgba(217,119,6,0.3)] mb-4 text-white">
                            <QrCode className="w-7 h-7" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('auth.registerTitle')}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-[15px]">{t('auth.registerSubtitle')}</p>
                    </div>

                    {/* Card container */}
                    <div className="bg-white dark:bg-neutral-900 py-8 px-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-800 transition-colors duration-200">
                        {apiError && (
                            <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                                {apiError}
                            </div>
                        )}

                        {/* ── Primary Action: Continue with Google ── */}
                        <div className="space-y-4">
                            <GoogleAuthButton
                                onSuccess={handleGoogleSuccess}
                                onError={(err) => setApiError(err || 'Google sign up failed')}
                                isLoading={isGoogleLoading}
                                text="signup_with"
                            />

                            {!showEmailForm && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailForm(true)}
                                        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors cursor-pointer"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <span>{t('auth.sign_up_with_email_instead', { defaultValue: 'Sign up with email instead' })}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Secondary: Expandable Email Form ── */}
                        {showEmailForm && (
                            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in-up">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('auth.name')}</label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            autoComplete="name"
                                            placeholder={t('auth.ph_name')}
                                            className={`w-full h-[46px] px-4 rounded-xl border bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-[3px] ${
                                                errors.name ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 focus:ring-amber-500/20 focus:border-amber-500'
                                            }`}
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name?.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('auth.email')}</label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            autoComplete="email"
                                            placeholder={t('auth.ph_email')}
                                            className={`w-full h-[46px] px-4 rounded-xl border bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-[3px] ${
                                                errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 focus:ring-amber-500/20 focus:border-amber-500'
                                            }`}
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email?.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('auth.password')}</label>
                                        <div className="relative">
                                            <input
                                                {...register('password')}
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                placeholder={t('auth.ph_min_8')}
                                                className={`w-full h-[46px] px-4 pr-11 rounded-xl border bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-[3px] ${
                                                    errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 focus:ring-amber-500/20 focus:border-amber-500'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                                                onClick={() => setShowPassword(s => !s)}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
                                    </div>
                                    <div className="pt-2">
                                        <Button type="submit" className="w-full h-[46px] font-semibold text-[15px]" size="lg" isLoading={isSubmitting}>
                                            {t('auth.registerCta')}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Bottom Link: Already have account */}
                    <p className="text-center mt-6 text-sm text-neutral-500 dark:text-neutral-400">
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="text-amber-600 dark:text-amber-500 font-semibold hover:text-amber-700 dark:hover:text-amber-400">
                            {t('auth.signInHere')}
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
