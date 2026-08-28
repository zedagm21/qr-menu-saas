import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, ArrowRight, ArrowLeft, RotateCw, CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

interface ForgotPasswordWizardProps {
    initialEmail?: string;
    onBackToLogin: () => void;
    onSuccess?: (email: string) => void;
}

export const ForgotPasswordWizard: React.FC<ForgotPasswordWizardProps> = ({
    initialEmail = '',
    onBackToLogin,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const { forgotPassword, resetPassword } = useAuth();

    const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
    const [email, setEmail] = useState(initialEmail);
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [countdown, setCountdown] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [apiError, setApiError] = useState('');

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-focus first OTP input when reaching 'reset' step
    useEffect(() => {
        if (step === 'reset') {
            setTimeout(() => {
                inputsRef.current[0]?.focus();
            }, 100);
        }
    }, [step]);

    // Password strength check
    const isMinLength = newPassword.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    // Helper to distribute multiple digits across the OTP inputs (supports mobile paste and autofill)
    const distributeDigits = (rawText: string, startIndex: number = 0) => {
        setApiError('');
        const cleanDigits = rawText.replace(/\D/g, '');
        if (!cleanDigits) return;

        const newDigits = [...digits];
        // If 6 digits or starting at index 0, fill from 0; otherwise fill from startIndex
        const effectiveStart = cleanDigits.length === OTP_LENGTH ? 0 : startIndex;
        const chars = cleanDigits.slice(0, OTP_LENGTH - effectiveStart).split('');

        chars.forEach((c, i) => {
            if (effectiveStart + i < OTP_LENGTH) {
                newDigits[effectiveStart + i] = c;
            }
        });

        setDigits(newDigits);

        const nextIndex = Math.min(effectiveStart + chars.length, OTP_LENGTH - 1);
        inputsRef.current[nextIndex]?.focus();
    };

    // Handle digit input change (handles single typing, paste via keyboard autofill, mobile context menu)
    const handleDigitChange = (index: number, value: string) => {
        setApiError('');
        const clean = value.replace(/\D/g, '');

        // If multiple digits pasted or autofilled by mobile keyboard
        if (clean.length > 1) {
            distributeDigits(clean, index);
            return;
        }

        // Single digit entry
        const char = clean.slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        if (char && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    // Handle Backspace and arrow navigation in OTP
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                setDigits(newDigits);
                inputsRef.current[index - 1]?.focus();
            } else {
                const newDigits = [...digits];
                newDigits[index] = '';
                setDigits(newDigits);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    // Handle paste in OTP
    const handlePaste = (e: React.ClipboardEvent, index: number = 0) => {
        e.preventDefault();
        setApiError('');
        const pasteData = e.clipboardData?.getData('text') || '';
        distributeDigits(pasteData, index);
    };

    // Step 1: Request Reset Code
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setApiError(t('auth.validation.invalid_email', { defaultValue: 'Please enter a valid email address' }));
            return;
        }

        setIsSubmitting(true);
        setApiError('');

        try {
            const res = await forgotPassword(trimmedEmail);
            toast.success(t('auth.forgot.code_sent_toast', { defaultValue: 'Reset code sent to your email!' }));
            setCountdown(COOLDOWN_SECONDS);
            setStep('reset');
        } catch (err: any) {
            const msg = err?.response?.data?.error || t('errors.generic', { defaultValue: 'Failed to request reset code.' });
            setApiError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resend Code
    const handleResendCode = async () => {
        if (countdown > 0 || isResending) return;
        setIsResending(true);
        setApiError('');

        try {
            await forgotPassword(email.trim().toLowerCase());
            toast.success(t('auth.forgot.code_sent_toast', { defaultValue: 'Reset code sent to your email!' }));
            setCountdown(COOLDOWN_SECONDS);
            setDigits(Array(OTP_LENGTH).fill(''));
            inputsRef.current[0]?.focus();
        } catch (err: any) {
            const msg = err?.response?.data?.error || t('errors.generic', { defaultValue: 'Failed to resend code.' });
            setApiError(msg);
        } finally {
            setIsResending(false);
        }
    };

    // Step 2: Submit Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = digits.join('');
        if (otp.length !== OTP_LENGTH) {
            setApiError(t('auth.validation.otp_required', { defaultValue: 'Please enter the complete 6-digit code.' }));
            return;
        }

        if (!isMinLength) {
            setApiError(t('auth.validation.password_min', { defaultValue: 'Password must be at least 8 characters' }));
            return;
        }

        if (newPassword !== confirmPassword) {
            setApiError(t('auth.forgot.passwords_mismatch', { defaultValue: 'Passwords do not match' }));
            return;
        }

        setIsSubmitting(true);
        setApiError('');

        try {
            await resetPassword({
                email: email.trim().toLowerCase(),
                otp,
                password: newPassword,
            });

            toast.success(t('auth.forgot.reset_success_toast', { defaultValue: 'Password reset successfully!' }));
            setStep('success');
            if (onSuccess) {
                onSuccess(email.trim().toLowerCase());
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || t('errors.generic', { defaultValue: 'Failed to reset password.' });
            setApiError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-13 h-13 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-2xl shadow-lg shadow-amber-500/25 mb-4 text-white">
                    {step === 'success' ? (
                        <CheckCircle2 className="w-7 h-7 text-white" />
                    ) : (
                        <KeyRound className="w-6 h-6 text-white" />
                    )}
                </div>

                {step === 'request' && (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {t('auth.forgot.title', { defaultValue: 'Reset your password' })}
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm max-w-sm mx-auto">
                            {t('auth.forgot.subtitle', { defaultValue: "Enter your email and we'll send you a 6-digit code to reset your password." })}
                        </p>
                    </>
                )}

                {step === 'reset' && (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {t('auth.forgot.enter_code_title', { defaultValue: 'Set new password' })}
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm max-w-sm mx-auto">
                            {t('auth.forgot.enter_code_subtitle', { defaultValue: 'Enter the 6-digit code sent to {{email}} and choose your new password.', email })}
                        </p>
                    </>
                )}

                {step === 'success' && (
                    <>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {t('auth.forgot.success_heading', { defaultValue: 'Password Reset Complete!' })}
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm max-w-sm mx-auto">
                            {t('auth.forgot.success_desc', { defaultValue: 'Your password has been securely updated. You can now sign in to your account.' })}
                        </p>
                    </>
                )}
            </div>

            {/* Error Notification */}
            {apiError && (
                <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-sm text-red-700 dark:text-red-300 animate-fade-in flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 inline-block w-2 h-2 rounded-full bg-red-500" />
                    <span className="flex-1 text-[13.5px] leading-relaxed">{apiError}</span>
                </div>
            )}

            {/* ── STEP 1: REQUEST OTP ── */}
            {step === 'request' && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                            {t('auth.forgot.email_label', { defaultValue: 'Account Email' })}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setApiError('');
                                }}
                                required
                                autoComplete="email"
                                placeholder={t('auth.ph_email', { defaultValue: 'you@restaurant.com' })}
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20"
                        size="lg"
                    >
                        <span>{t('auth.forgot.send_code_button', { defaultValue: 'Send Reset Code' })}</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={onBackToLogin}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('auth.forgot.back_to_login', { defaultValue: 'Back to sign in' })}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* ── STEP 2: ENTER OTP & NEW PASSWORD ── */}
            {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* 6-digit OTP code */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {t('auth.forgot.otp_label', { defaultValue: '6-Digit Code' })}
                            </label>
                            {countdown > 0 ? (
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                    {t('auth.forgot.resend_in', { defaultValue: 'Resend in' })} {countdown}s
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isResending}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 cursor-pointer disabled:opacity-50"
                                >
                                    <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                                    <span>{t('auth.forgot.resend_code', { defaultValue: 'Resend code' })}</span>
                                </button>
                            )}
                        </div>

                        <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={(e) => handlePaste(e, 0)}>
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => (inputsRef.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={OTP_LENGTH}
                                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                    value={digit}
                                    onFocus={e => e.target.select()}
                                    onPaste={e => handlePaste(e, index)}
                                    onChange={e => handleDigitChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold rounded-xl border transition-all shadow-sm focus:outline-none focus:ring-2 ${
                                        digit
                                            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-500/10 text-neutral-900 dark:text-neutral-50 focus:ring-amber-500/20'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-amber-500/20 focus:border-amber-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                            {t('auth.forgot.new_password', { defaultValue: 'New Password' })}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setApiError('');
                                }}
                                required
                                autoComplete="new-password"
                                placeholder={t('auth.forgot.ph_new_password', { defaultValue: 'At least 8 characters' })}
                                className="w-full h-12 pl-10 pr-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Password rules pills */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                isMinLength
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                                <ShieldCheck className="w-3 h-3" />
                                {t('auth.ph_min_8', { defaultValue: '8+ chars' })}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                hasLetter && hasNumber
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                                <ShieldCheck className="w-3 h-3" />
                                Letters & numbers
                            </span>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                            {t('auth.forgot.confirm_password', { defaultValue: 'Confirm New Password' })}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setApiError('');
                                }}
                                required
                                autoComplete="new-password"
                                placeholder={t('auth.forgot.ph_confirm_password', { defaultValue: 'Confirm your new password' })}
                                className={`w-full h-12 pl-10 pr-11 rounded-xl border bg-white dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[15px] transition-all shadow-sm focus:outline-none focus:ring-2 ${
                                    confirmPassword && !passwordsMatch
                                        ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500'
                                        : 'border-neutral-200 dark:border-neutral-700 focus:ring-amber-500/20 focus:border-amber-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                {t('auth.forgot.passwords_mismatch', { defaultValue: 'Passwords do not match' })}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        disabled={digits.join('').length !== OTP_LENGTH || !isMinLength || !passwordsMatch}
                        className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20"
                        size="lg"
                    >
                        <span>{t('auth.forgot.reset_button', { defaultValue: 'Reset Password' })}</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setStep('request')}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('auth.forgot.change_email', { defaultValue: 'Use different email' })}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* ── STEP 3: SUCCESS STATE ── */}
            {step === 'success' && (
                <div className="space-y-4 text-center">
                    <Button
                        type="button"
                        onClick={onBackToLogin}
                        className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20"
                        size="lg"
                    >
                        <span>{t('auth.login', { defaultValue: 'Sign In with New Password' })}</span>
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                </div>
            )}
        </div>
    );
};
