import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { MailCheck, ArrowRight, RotateCw, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

const VerifyEmailPage: React.FC = () => {
    const { t } = useTranslation();
    const { verifyOtp, resendOtp } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const email = searchParams.get('email') || '';
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(COOLDOWN_SECONDS);
    const [apiError, setApiError] = useState('');

    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resending
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    // Helper to distribute multiple digits across the OTP inputs (supports mobile paste and autofill)
    const distributeDigits = (rawText: string, startIndex: number = 0) => {
        setApiError('');
        const cleanDigits = rawText.replace(/\D/g, '');
        if (!cleanDigits) return;

        const newDigits = [...digits];
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

        if (newDigits.every(d => d !== '')) {
            submitCode(newDigits.join(''));
        }
    };

    // Handle digit input change
    const handleChange = (index: number, value: string) => {
        setApiError('');
        const clean = value.replace(/\D/g, '');

        // If multiple digits pasted or autofilled by mobile keyboard
        if (clean.length > 1) {
            distributeDigits(clean, index);
            return;
        }

        const char = clean.slice(-1);
        const newDigits = [...digits];
        newDigits[index] = char;
        setDigits(newDigits);

        if (char && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        // If all digits are filled, automatically submit
        if (char && index === OTP_LENGTH - 1 && newDigits.every(d => d !== '')) {
            submitCode(newDigits.join(''));
        }
    };

    // Handle backspace and arrow navigation
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

    // Handle full paste
    const handlePaste = (e: React.ClipboardEvent, index: number = 0) => {
        e.preventDefault();
        setApiError('');
        const pasteData = e.clipboardData?.getData('text') || '';
        distributeDigits(pasteData, index);
    };

    const submitCode = async (code: string) => {
        if (!email) {
            setApiError(t('auth.verify.missing_email', { defaultValue: 'No email address found. Please register again.' }));
            return;
        }

        setIsVerifying(true);
        setApiError('');

        try {
            await verifyOtp(email, code);
            toast.success(t('auth.verify.success_toast', { defaultValue: 'Email verified successfully! Complete your restaurant profile.' }));
            // As per design, take user directly to Restaurant Profile page
            navigate('/dashboard/restaurant', { replace: true });
        } catch (err: any) {
            const msg = err?.response?.data?.error || t('errors.generic', { defaultValue: 'Failed to verify code. Please try again.' });
            setApiError(msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || !email) return;

        setIsResending(true);
        setApiError('');

        try {
            await resendOtp(email);
            toast.success(t('auth.verify.resend_success', { defaultValue: 'A new 6-digit code has been sent to your email.' }));
            setCountdown(COOLDOWN_SECONDS);
            setDigits(Array(OTP_LENGTH).fill(''));
            inputsRef.current[0]?.focus();
        } catch (err: any) {
            const msg = err?.response?.data?.error || t('errors.generic', { defaultValue: 'Could not resend code. Please try again later.' });
            setApiError(msg);
        } finally {
            setIsResending(false);
        }
    };

    const isCodeComplete = digits.every(d => d !== '');

    return (
        <>
            <Helmet>
                <title>{t('auth.verify.title', { defaultValue: 'Verify Your Email' })} — QR Menu</title>
            </Helmet>
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 rounded-2xl shadow-[0_4px_16px_rgba(217,119,6,0.3)] mb-4 text-white">
                            <MailCheck className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {t('auth.verify.title', { defaultValue: 'Check your email' })}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-[14px] leading-relaxed">
                            {t('auth.verify.subtitle', { defaultValue: 'We sent a 6-digit verification code to' })}
                            <br />
                            <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">{email || 'your email address'}</strong>
                        </p>
                    </div>

                    {/* Card container */}
                    <div className="bg-white dark:bg-neutral-900 py-8 px-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl sm:px-10 border border-neutral-100 dark:border-neutral-800 transition-colors duration-200">
                        {apiError && (
                            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                                {apiError}
                            </div>
                        )}

                        {/* 6-Digit OTP Inputs */}
                        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6" onPaste={(e) => handlePaste(e, 0)}>
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
                                    onChange={e => handleChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border transition-all shadow-sm focus:outline-none focus:ring-[3px] ${
                                        digit
                                            ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-500/10 text-neutral-900 dark:text-neutral-50 focus:ring-amber-500/20'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-amber-500/20 focus:border-amber-500'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="space-y-4">
                            <Button
                                type="button"
                                onClick={() => submitCode(digits.join(''))}
                                disabled={!isCodeComplete || isVerifying}
                                isLoading={isVerifying}
                                className="w-full h-12 text-[15px] font-semibold"
                                size="lg"
                                icon={<ArrowRight className="w-4 h-4 ml-1" />}
                            >
                                {t('auth.verify.verify_button', { defaultValue: 'Verify & Continue' })}
                            </Button>

                            {/* Resend Action */}
                            <div className="text-center pt-2">
                                {countdown > 0 ? (
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                        {t('auth.verify.resend_in', { defaultValue: 'Resend code in' })}{' '}
                                        <span className="font-semibold text-neutral-600 dark:text-neutral-300">{countdown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                                    >
                                        <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                        {t('auth.verify.resend_code', { defaultValue: 'Resend verification code' })}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Spam Folder Reminder */}
                        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                                <span>{t('auth.verify.spam_hint', { defaultValue: "Didn't see the email? Please check your Spam or Junk folder." })}</span>
                            </p>
                        </div>
                    </div>

                    {/* Back to Login link */}
                    <p className="text-center mt-6 text-sm text-neutral-500 dark:text-neutral-400">
                        <Link to="/login" className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            {t('auth.verify.back_to_login', { defaultValue: 'Back to sign in' })}
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default VerifyEmailPage;
