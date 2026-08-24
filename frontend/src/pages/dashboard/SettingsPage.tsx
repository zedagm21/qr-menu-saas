import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { User, LogOut, Trash2, Shield, Moon, Sun, Monitor, Languages, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';

type ThemeType = 'light' | 'dark' | 'auto';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, updatePassword, logout } = useAuth();
    const { theme, setTheme } = useDashboardTheme();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (data: any) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error(t('toast.passwordsNoMatch'));
            return;
        }
        try {
            await updatePassword(data.currentPassword, data.newPassword);
            toast.success(t('toast.passwordUpdated'), { icon: '🔒' });
        } catch (error) {
            console.error('Failed to update password', error);
            toast.error(t('toast.passwordError'));
        }
    };

    return (
        <>
            <Helmet><title>{t('settings.title')} — QR Menu</title></Helmet>

            <div className="min-h-full bg-white dark:!bg-neutral-950 dark:!text-white p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto space-y-6 pb-28 lg:pb-12 transition-colors duration-200">

                {/* ── Header ── */}
                <div className="animate-fade-in-up delay-0">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">{t('settings.title')}</h1>
                    <p className="text-[15px] font-medium text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
                        {t('settings.subtitle')}
                    </p>
                </div>

                <div className="space-y-6 animate-fade-in-up delay-75">

                    {/* ── Section: Account Profile ── */}
                    <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] overflow-hidden backdrop-blur-md">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{t("settings.account_profile")}</h2>
                                    <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{t("settings.account_desc")}</p>
                                </div>
                            </div>

                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 sm:p-6 border border-neutral-100 dark:border-neutral-800 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[12px] font-bold text-neutral-700 dark:text-neutral-400 uppercase tracking-widest">{t("settings.full_name")}</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 break-all">{user?.name || t('settings.no_name_set')}</p>
                                </div>
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
                                    <p className="text-[12px] font-bold text-neutral-700 dark:text-neutral-400 uppercase tracking-widest">{t('auth.email')}</p>
                                    <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50 break-all">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Appearance ── */}
                    <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] overflow-hidden backdrop-blur-md">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <Sun className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{t("settings.appearance")}</h2>
                                    <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{t("settings.appearance_desc")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { value: 'light', icon: Sun, label: t('settings.light_mode', { defaultValue: 'Light Mode' }), desc: t('settings.light_mode_desc', { defaultValue: 'Clean & bright' }) },
                                    { value: 'dark', icon: Moon, label: t('settings.dark_mode', { defaultValue: 'Dark Mode' }), desc: t('settings.dark_mode_desc', { defaultValue: 'Easy on eyes' }) },
                                    { value: 'auto', icon: Monitor, label: t('settings.system', { defaultValue: 'System' }), desc: t('settings.system_desc', { defaultValue: 'Auto adapts' }) }
                                ].map(({ value, icon: Icon, label, desc }) => (
                                    <button
                                        key={value}
                                        onClick={() => setTheme(value as ThemeType)}
                                        className={cn(
                                            'flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 active:scale-95 gap-3',
                                            theme === value
                                                ? 'bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 border-[color:var(--color-brand-500)] text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] shadow-sm'
                                                : 'bg-white/90 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        <Icon className={cn('w-6 h-6', theme === value && value === 'dark' ? 'fill-current' : '')} />
                                        <div className="text-center">
                                            <p className="text-[14px] font-bold tracking-tight">{label}</p>
                                            <p className={cn("text-[11px] font-semibold mt-0.5", theme === value ? 'text-[color:var(--color-brand-600)]/80 dark:text-[color:var(--color-brand-400)]/80' : 'text-neutral-500 dark:text-neutral-400')}>{desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Language ── */}
                    <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] overflow-hidden backdrop-blur-md">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Languages className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{t("settings.language")}</h2>
                                    <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{t("settings.language_desc")}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {[
                                    { lng: 'en', flag: '🇬🇧', label: 'English' },
                                    { lng: 'am', flag: '🇪🇹', label: 'አማርኛ', font: 'font-ethiopic' }
                                ].map(({ lng, flag, label, font }) => (
                                    <button
                                        key={lng}
                                        onClick={() => i18n.changeLanguage(lng)}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95',
                                            i18n.language === lng
                                                ? 'bg-[color:var(--color-brand-50)] dark:bg-[color:var(--color-brand-500)]/10 border-[color:var(--color-brand-500)] text-[color:var(--color-brand-700)] dark:text-[color:var(--color-brand-400)] shadow-sm'
                                                : 'bg-white/90 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        )}
                                    >
                                        <span className="text-xl">{flag}</span>
                                        <span className={cn('text-[15px] font-bold', font)}>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Security ── */}
                    <div className="bg-white/95 dark:bg-neutral-900/95 border border-neutral-200/90 dark:border-neutral-800/90 rounded-[28px] overflow-hidden backdrop-blur-md">
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{t("settings.security")}</h2>
                                    <p className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{t("settings.security_desc")}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">{t("settings.current_password")}</label>
                                    <input
                                        type="password"
                                        {...register('currentPassword', { required: true })}
                                        className="w-full h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-medium text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">{t("settings.new_password")}</label>
                                    <input
                                        type="password"
                                        {...register('newPassword', { required: true, minLength: 6 })}
                                        className="w-full h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-medium text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">{t("settings.confirm_new_password")}</label>
                                    <input
                                        type="password"
                                        {...register('confirmPassword', { required: true })}
                                        className="w-full h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-[14px] font-medium text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/30 focus:border-[color:var(--color-brand-500)] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isSubmitting}
                                    className="h-11 px-8 rounded-xl bg-[color:var(--color-brand-500)] hover:bg-[color:var(--color-brand-600)] text-white font-bold"
                                    icon={<Save className="w-4 h-4 stroke-[2.5]" />}
                                >
                                    {t('settings.update_password', { defaultValue: 'Update Password' })}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* ── Section: Danger Zone ── */}
                    <div className="bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-[28px] overflow-hidden backdrop-blur-md">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-red-900 dark:text-red-50 tracking-tight">{t('settings.danger_zone')}</h2>
                                    <p className="text-[13px] font-medium text-red-700/80 dark:text-red-300">{t('settings.logout_warning')}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="flex-1 h-12 rounded-xl border-red-200 dark:border-red-800/50 bg-white/50 dark:bg-red-900/10 text-red-700 dark:text-red-300 hover:bg-red-100 hover:border-red-300 dark:hover:bg-red-900/30 dark:hover:border-red-700 font-bold"
                                    icon={<LogOut className="w-4 h-4 text-red-500/70 dark:text-red-400" />}
                                >
                                    {t('auth.logout')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl border-transparent bg-red-600/10 text-red-700 dark:text-red-300 hover:bg-red-600 hover:text-white dark:hover:bg-red-700 dark:hover:text-white transition-colors duration-200 font-bold"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={() => toast(t('settings.contact_support_delete'), { icon: '📧', duration: 5000 })}
                                >
                                    {t('settings.delete_account', { defaultValue: 'Delete Account' })}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showLogoutConfirm && (
                <ConfirmDialog
                    isOpen={showLogoutConfirm}
                    onClose={() => setShowLogoutConfirm(false)}
                    onConfirm={logout}
                    title={t('actions.signOut')}
                    description={t('actions.signOutDesc')}
                    confirmText={t('auth.logout')}
                    cancelText={t('common.cancel')}
                    isDestructive={true}
                />
            )}
        </>
    );
};

export default SettingsPage;
