import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { MailCheck, ArrowRight, RotateCw, ArrowLeft, Info, QrCode, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

const VerifyEmailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { verifyOtp, resendOtp } = useAuth();
    const { theme, setTheme } = useDashboardTheme();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'am' ? 'en' : 'am';
        i18n.changeLanguage(nextLang);
    };

    const toggleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else setTheme('dark');
    };

    const isDarkMode = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
                <title>{t('auth.verify.title', { defaultValue: 'Verify Your Email' })} — OurMenu</title>
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

                {/* Main Auth Container */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 w-full my-auto">
                    <div className="w-full max-w-[440px] sm:max-w-[460px]">
                        {/* Header */}
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {t('auth.verify.title', { defaultValue: 'Check your email' })}
                            </h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm sm:text-[15px] leading-relaxed">
                                {t('auth.verify.subtitle', { defaultValue: 'We sent a 6-digit verification code to' })}
                                <br />
                                <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">{email || 'your email address'}</strong>
                            </p>
                        </div>

                        {/* Card container */}
                        <div className="bg-white/90 dark:bg-neutral-900/85 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl shadow-neutral-950/5 dark:shadow-black/40 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 transition-all duration-200">
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
                                    className="w-full h-12 text-[15px] font-semibold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-500/20"
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

export default VerifyEmailPage;
