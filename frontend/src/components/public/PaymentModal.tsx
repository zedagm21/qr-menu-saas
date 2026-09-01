import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Copy, Check } from 'lucide-react';
import { cn, getTranslation } from '../../lib/utils';
import type { Restaurant } from '../../types';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    isAm?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    restaurant,
    isAm = false,
}) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    // Escape key dismiss
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !restaurant || !restaurant.paymentInfo) return null;

    const lang = isAm ? 'AM' : 'EN';
    const translations = restaurant.translations ?? [];
    const displayName = getTranslation(translations, lang, 'name') || restaurant.name || '';

    const handleCopy = () => {
        if (!restaurant.paymentInfo) return;
        navigator.clipboard.writeText(restaurant.paymentInfo);
        setCopied(true);
        toast.success(t('public.copied', { defaultValue: 'Copied to clipboard!' }), { id: 'payment-copied' });
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
        >
            <div
                className={cn(
                    "w-full sm:max-w-md bg-white dark:bg-[#141414] text-neutral-900 dark:text-[#F5F5F5] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/80 dark:border-[#2A2A2A] flex flex-col max-h-[85vh] overflow-hidden animate-slide-up sm:animate-scale-up",
                    isAm && "font-ethiopic"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile Drag Indicator */}
                <div className="sm:hidden pt-2 pb-0.5 flex justify-center shrink-0">
                    <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {/* Header */}
                <div className="relative px-5 pt-3 pb-3 border-b border-neutral-100 dark:border-[#222222] shrink-0">
                    <button
                        onClick={onClose}
                        aria-label={t('public.close', { defaultValue: 'Close' })}
                        className="absolute right-3.5 top-3.5 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#222222] text-neutral-500 dark:text-[#A3A3A3] hover:text-neutral-900 dark:hover:text-[#F5F5F5] hover:bg-neutral-200 dark:hover:bg-[#2E2E2E] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 id="payment-modal-title" className="text-base font-extrabold text-neutral-900 dark:text-[#F5F5F5] truncate">
                                {t('public.payment', { defaultValue: 'Payment' })}
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-[#A3A3A3] truncate">
                                {displayName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Info Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200/70 dark:border-[#262626] relative group">
                        <div className="text-[13px] sm:text-[14px] text-neutral-800 dark:text-[#E5E5E5] whitespace-pre-line leading-relaxed font-sans">
                            {restaurant.paymentInfo}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="w-full py-3 px-4 rounded-xl bg-[color:var(--color-brand-500)] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? t('public.copied', { defaultValue: 'Copied!' }) : (lang === 'AM' ? 'የክፍያ መረጃ ቅዳ' : 'Copy Payment Details')}</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-3.5 border-t border-neutral-100 dark:border-[#222222] bg-neutral-50/60 dark:bg-[#161616]/60 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                    >
                        {t('public.close', { defaultValue: 'Close' })}
                    </button>
                </div>
            </div>
        </div>
    );
};
