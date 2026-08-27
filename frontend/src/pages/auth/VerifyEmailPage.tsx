import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { MailCheck, ArrowRight, RotateCw, ArrowLeft } from 'lucide-react';
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

    // Handle digit input change
    const handleChange = (index: number, value: string) => {
        setApiError('');
        const char = value.slice(-1); // Take the latest character

        if (!/^\d*$/.test(char)) return; // Digits only

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
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        setApiError('');
        const pasteData = e.clipboardData.getData('text').trim();
        const cleanDigits = pasteData.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');

        if (cleanDigits.length === 0) return;

        const newDigits = Array(OTP_LENGTH).fill('');
        cleanDigits.forEach((digit, i) => {
            newDigits[i] = digit;
        });
        setDigits(newDigits);

        // Focus the next empty input or last input
        const nextIndex = Math.min(cleanDigits.length, OTP_LENGTH - 1);
        inputsRef.current[nextIndex]?.focus();

        if (cleanDigits.length === OTP_LENGTH) {
            submitCode(newDigits.join(''));
        }
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
            <div className="min-h-screen bg-neutral-50 overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-600 rounded-2xl shadow-[0_4px_16px_rgba(217,119,6,0.3)] mb-4 text-white">
                            <MailCheck className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                            {t('auth.verify.title', { defaultValue: 'Check your email' })}
                        </h1>
                        <p className="text-neutral-500 mt-2 text-[14px] leading-relaxed">
                            {t('auth.verify.subtitle', { defaultValue: 'We sent a 6-digit verification code to' })}
                            <br />
                            <strong className="text-neutral-900 font-semibold">{email || 'your email address'}</strong>
                        </p>
                    </div>

                    {/* Card container */}
                    <div className="bg-white py-8 px-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] rounded-2xl sm:px-10 border border-neutral-100">
                        {apiError && (
                            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                {apiError}
                            </div>
                        )}

                        {/* 6-Digit OTP Inputs */}
                        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => (inputsRef.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border transition-all shadow-sm focus:outline-none focus:bg-white focus:ring-[3px] ${
                                        digit
                                            ? 'border-amber-500 bg-amber-50/20 text-neutral-900 focus:ring-amber-500/20'
                                            : 'border-neutral-200 bg-white/50 text-neutral-900 focus:ring-amber-500/20 focus:border-amber-500'
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
                                    <p className="text-xs text-neutral-400">
                                        {t('auth.verify.resend_in', { defaultValue: 'Resend code in' })}{' '}
                                        <span className="font-semibold text-neutral-600">{countdown}s</span>
                                    </p>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                    >
                                        <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                        {t('auth.verify.resend_code', { defaultValue: 'Resend verification code' })}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Back to Login link */}
                    <p className="text-center mt-6 text-sm text-neutral-500">
                        <Link to="/login" className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition-colors">
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
