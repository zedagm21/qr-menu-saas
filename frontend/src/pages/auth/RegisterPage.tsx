import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { QrCode, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

interface FormData {
    name: string;
    email: string;
    password: string;
    restaurantName: string;
}

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState('');

    const schema = useMemo(() => z.object({
        name: z.string().min(2, t('auth.validation.name_min')),
        email: z.string().email(t('auth.validation.invalid_email')),
        password: z.string().min(8, t('auth.validation.password_min')),
        restaurantName: z.string().min(2, t('auth.validation.restaurant_name_min')),
    }), [t]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setApiError('');
        try {
            await registerUser(data);
            navigate('/dashboard');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { error?: string } } };
            setApiError(e?.response?.data?.error || t('errors.generic'));
        }
    };

    return (
        <>
            <Helmet>
                <title>{t('auth.registerTitle')} — QR Menu</title>
            </Helmet>
            <div className="min-h-screen bg-neutral-50 overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 rounded-xl shadow-[0_2px_8px_rgba(217,119,6,0.3)] mb-4">
                            <QrCode className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">{t('auth.registerTitle')}</h1>
                        <p className="text-neutral-500 mt-2 text-[15px]">{t('auth.registerSubtitle')}</p>
                    </div>

                    <div className="bg-white py-8 px-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:rounded-2xl sm:px-10 border border-neutral-100">
                        {apiError && (
                            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {apiError}
                            </div>
                        )}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {[
                                { field: 'name' as const, label: t('auth.name'), type: 'text', autoComplete: 'name', placeholder: t('auth.ph_name') },
                                { field: 'restaurantName' as const, label: t('auth.restaurantName'), type: 'text', autoComplete: 'organization', placeholder: t('auth.ph_restaurant_name') },
                                { field: 'email' as const, label: t('auth.email'), type: 'email', autoComplete: 'email', placeholder: t('auth.ph_email') },
                            ].map(({ field, label, type, autoComplete, placeholder }) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
                                    <input
                                        {...register(field)}
                                        type={type}
                                        autoComplete={autoComplete}
                                        placeholder={placeholder}
                                        className={`w-full h-[46px] px-4 rounded-xl border bg-white/50 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white focus:ring-[3px] ${errors[field] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 hover:border-neutral-300 focus:ring-amber-500/20 focus:border-amber-500'}`}
                                    />
                                    {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]?.message}</p>}
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('auth.password')}</label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder={t("auth.ph_min_8")}
                                        className={`w-full h-[46px] px-4 pr-11 rounded-xl border bg-white/50 text-[15px] transition-all shadow-sm focus:outline-none focus:bg-white focus:ring-[3px] ${errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-neutral-200 hover:border-neutral-300 focus:ring-amber-500/20 focus:border-amber-500'}`}
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
                                <Button type="submit" className="w-full h-[46px] font-semibold text-[15px]" size="lg" isLoading={isSubmitting}>
                                    {t('auth.registerCta')}
                                </Button>
                            </div>
                        </form>
                    </div>
                    <p className="text-center mt-6 text-sm text-neutral-500">
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="text-amber-600 font-medium hover:text-amber-700">
                            {t('auth.signInHere')}
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
