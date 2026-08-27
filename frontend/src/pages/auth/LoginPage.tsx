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
    email: string;
    password: string;
}

const LoginPage: React.FC = () => {
    const { t } = useTranslation();
    const { login, googleAuth } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const schema = useMemo(() => z.object({
        email: z.string().email(t('auth.validation.invalid_email')),
        password: z.string().min(1, t('auth.validation.password_required')),
    }), [t]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setApiError('');
        try {
            await login(data.email, data.password);
            navigate('/dashboard');
        } catch (err: any) {
            const resData = err?.response?.data;
            if (resData?.error === 'EMAIL_NOT_VERIFIED') {
                const unverifiedEmail = resData?.data?.email || data.email;
                toast.error(t('auth.verify.please_verify_toast', { defaultValue: 'Please verify your email before signing in.' }));
                navigate(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`);
                return;
            }
            setApiError(resData?.error || t('errors.generic'));
        }
    };

    const handleGoogleSuccess = async (credential: string) => {
        setIsGoogleLoading(true);
        setApiError('');
        try {
            const result = await googleAuth(credential);
            if (result.isNewUser) {
                // First-time users land directly on Restaurant Profile to fill it in
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
                <title>{t('auth.loginTitle')} — QR Menu</title>
            </Helmet>
            <div className="min-h-screen bg-neutral-50 overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Logo & Heading */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 rounded-2xl shadow-[0_2px_8px_rgba(217,119,6,0.3)] mb-4 text-white">
                            <QrCode className="w-7 h-7" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{t('auth.loginTitle')}</h1>
                        <p className="text-neutral-500 mt-2 text-[15px]">{t('auth.loginSubtitle')}</p>
                    </div>

                    {/* Card container */}
                    <div className="bg-white py-8 px-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] rounded-2xl sm:px-10 border border-neutral-100">
                        {apiError && (
                            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {apiError}
                            </div>
                        )}

                        {/* ── Primary Action: Continue with Google ── */}
                        <div className="space-y-4">
                            <GoogleAuthButton
                                onSuccess={handleGoogleSuccess}
                                onError={(err) => setApiError(err || 'Google sign in failed')}
                                isLoading={isGoogleLoading}
                                text="continue_with"
                            />

                            {!showEmailForm && (
                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailForm(true)}
                                        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 hover:text-amber-600 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <span>{t('auth.sign_in_with_email_instead', { defaultValue: 'Sign in with email instead' })}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Secondary: Expandable Email Form ── */}
                        {showEmailForm && (
                            <div className="mt-6 pt-6 border-t border-neutral-100 animate-fade-in-up">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                            {t('auth.email')}
                                        </label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            autoComplete="email"
                                            className={`w-full h-[46px] px-4 rounded-xl border bg-white/50 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white focus:ring-[3px] ${
                                                errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 hover:border-neutral-300 focus:ring-amber-500/20 focus:border-amber-500'
                                            }`}
                                            placeholder={t('auth.ph_email')}
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                            {t('auth.password')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                {...register('password')}
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                className={`w-full h-[46px] px-4 pr-11 rounded-xl border bg-white/50 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white focus:ring-[3px] ${
                                                    errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 hover:border-neutral-300 focus:ring-amber-500/20 focus:border-amber-500'
                                                }`}
                                                placeholder={t('auth.ph_password')}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                                onClick={() => setShowPassword(s => !s)}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                                    </div>
                                    <div className="pt-2">
                                        <Button type="submit" className="w-full h-[46px] text-[15px] font-semibold" size="lg" isLoading={isSubmitting}>
                                            {t('auth.loginCta')}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Bottom Link: No account */}
                    <p className="text-center mt-6 text-sm text-neutral-500">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="text-amber-600 font-semibold hover:text-amber-700">
                            {t('auth.signUpFree')}
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
