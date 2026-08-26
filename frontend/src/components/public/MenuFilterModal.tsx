import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal, Leaf, Utensils, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterState {
    minPrice: string;
    maxPrice: string;
    fasting: 'all' | 'fasting' | 'non-fasting';
}

interface MenuFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: FilterState;
    onApply: (filters: FilterState) => void;
    currencyCode: string;
    isAm: boolean;
}

export const MenuFilterModal: React.FC<MenuFilterModalProps> = ({
    isOpen,
    onClose,
    currentFilters,
    onApply,
    currencyCode,
    isAm,
}) => {
    const { t } = useTranslation();
    const [minPrice, setMinPrice] = useState(currentFilters.minPrice);
    const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice);
    const [fasting, setFasting] = useState<'all' | 'fasting' | 'non-fasting'>(currentFilters.fasting);
    const [error, setError] = useState<string | null>(null);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMinPrice(currentFilters.minPrice);
            setMaxPrice(currentFilters.maxPrice);
            setFasting(currentFilters.fasting);
            setError(null);
        }
    }, [isOpen, currentFilters]);

    // Handle Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0)) {
            setMinPrice(val);
            setError(null);
        }
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0)) {
            setMaxPrice(val);
            setError(null);
        }
    };

    const handleClearAll = () => {
        setMinPrice('');
        setMaxPrice('');
        setFasting('all');
        setError(null);
        onApply({ minPrice: '', maxPrice: '', fasting: 'all' });
        onClose();
    };

    const handleApply = (e: React.FormEvent) => {
        e.preventDefault();
        const minNum = minPrice.trim() ? parseFloat(minPrice) : null;
        const maxNum = maxPrice.trim() ? parseFloat(maxPrice) : null;

        if (minNum !== null && maxNum !== null && minNum > maxNum) {
            setError(t('filters.invalid_price_range'));
            return;
        }

        onApply({
            minPrice: minPrice.trim(),
            maxPrice: maxPrice.trim(),
            fasting,
        });
        onClose();
    };

    const hasActiveValues = minPrice.trim() !== '' || maxPrice.trim() !== '' || fasting !== 'all';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal / Bottom-Sheet Container */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-modal-title"
                className={cn(
                    "relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] border-t sm:border border-black/5 dark:border-[#2A2A2A] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 transition-all duration-300 animate-slide-up sm:animate-scale-in",
                    isAm && "font-ethiopic"
                )}
            >
                {/* Mobile drag handle */}
                <div className="flex sm:hidden justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-black/5 dark:border-[#2A2A2A]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[color:var(--color-brand-500)]/10 text-[color:var(--color-brand-500)] flex items-center justify-center">
                            <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                            <h2
                                id="filter-modal-title"
                                className={cn(
                                    "text-lg font-black text-neutral-900 dark:text-[#F5F5F5] tracking-tight",
                                    isAm && "font-bold"
                                )}
                            >
                                {t('filters.title')}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close filters modal"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-[#252525] hover:bg-neutral-200 dark:hover:bg-[#333333] transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleApply} className="p-6 space-y-6 overflow-y-auto">
                    {/* Error Notice if invalid */}
                    {error && (
                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-semibold animate-shake">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 1. Price Range Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A3A3A3]">
                                {t('filters.price_range')}
                            </label>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#252525] text-neutral-600 dark:text-neutral-300">
                                {currencyCode}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* Min Price */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-neutral-600 dark:text-[#A3A3A3] block">
                                    {t('filters.min_price')}
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="any"
                                        placeholder={t('filters.min_placeholder')}
                                        value={minPrice}
                                        onChange={handleMinChange}
                                        className={cn(
                                            "w-full h-11 pl-3.5 pr-12 rounded-xl bg-neutral-100/80 dark:bg-[#111111] border border-transparent focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-[#000000] text-[14px] font-bold text-neutral-900 dark:text-[#F5F5F5] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/20 transition-all",
                                            isAm && "font-ethiopic font-semibold"
                                        )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 dark:text-neutral-500 pointer-events-none">
                                        {currencyCode}
                                    </span>
                                </div>
                            </div>

                            {/* Max Price */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-neutral-600 dark:text-[#A3A3A3] block">
                                    {t('filters.max_price')}
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="any"
                                        placeholder={t('filters.max_placeholder')}
                                        value={maxPrice}
                                        onChange={handleMaxChange}
                                        className={cn(
                                            "w-full h-11 pl-3.5 pr-12 rounded-xl bg-neutral-100/80 dark:bg-[#111111] border border-transparent focus:border-[color:var(--color-brand-500)] focus:bg-white dark:focus:bg-[#000000] text-[14px] font-bold text-neutral-900 dark:text-[#F5F5F5] placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]/20 transition-all",
                                            isAm && "font-ethiopic font-semibold"
                                        )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 dark:text-neutral-500 pointer-events-none">
                                        {currencyCode}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-black/5 dark:bg-[#2A2A2A]" />

                    {/* 2. Fasting Preference Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A3A3A3] block">
                            {t('filters.fasting_preference')}
                        </label>

                        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-[#111111] border border-black/5 dark:border-[#2A2A2A]">
                            {/* All */}
                            <button
                                type="button"
                                onClick={() => setFasting('all')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                                    fasting === 'all'
                                        ? "bg-white dark:bg-[#222222] text-neutral-900 dark:text-[#F5F5F5] shadow-xs border border-black/5 dark:border-[#333333]"
                                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                )}
                            >
                                <Utensils className="w-3.5 h-3.5 mb-1 opacity-70" />
                                <span className="truncate w-full text-center">{t('filters.all')}</span>
                            </button>

                            {/* Fasting Only */}
                            <button
                                type="button"
                                onClick={() => setFasting('fasting')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                                    fasting === 'fasting'
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-200 dark:border-emerald-800/50"
                                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                )}
                            >
                                <Leaf className="w-3.5 h-3.5 mb-1 text-emerald-600 dark:text-emerald-400" />
                                <span className="truncate w-full text-center">{t('filters.fasting_only')}</span>
                            </button>

                            {/* Non-Fasting Only */}
                            <button
                                type="button"
                                onClick={() => setFasting('non-fasting')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                                    fasting === 'non-fasting'
                                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-200 dark:border-amber-800/50"
                                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                                )}
                            >
                                <span className="text-[11px] mb-0.5">🥩</span>
                                <span className="truncate w-full text-center">{t('filters.non_fasting_only')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-[#2A2A2A]">
                        {hasActiveValues && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className={cn(
                                    "flex-1 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#252525] dark:hover:bg-[#303030] text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors cursor-pointer",
                                    isAm && "font-ethiopic"
                                )}
                            >
                                {t('filters.clear_all')}
                            </button>
                        )}

                        <button
                            type="submit"
                            className={cn(
                                "h-11 rounded-xl bg-[color:var(--color-brand-500)] hover:brightness-110 active:scale-98 text-white text-xs font-bold shadow-sm transition-all cursor-pointer",
                                hasActiveValues ? "flex-1" : "w-full",
                                isAm && "font-ethiopic"
                            )}
                        >
                            {t('filters.apply_filters')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
