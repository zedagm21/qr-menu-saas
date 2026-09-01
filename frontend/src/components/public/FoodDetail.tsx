import React, { useEffect } from 'react';
import { X, Star, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, cn } from '../../lib/utils';

interface FoodDetailProps {
    item: any;
    isOpen: boolean;
    onClose: () => void;
    isAm: boolean;
}

export const FoodDetail: React.FC<FoodDetailProps> = ({ item, isOpen, onClose, isAm }) => {
    const { t } = useTranslation();

    // Lock body scroll when overlay is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const name = item.name ?? '';
    const desc = item.description ?? '';
    const ingredients = item.ingredients ?? '';
    const allergens = item.allergens ?? '';
    const hasImage = !!item.imageUrl;
    const hasDiscount = item.discountPrice && parseFloat(item.discountPrice) < parseFloat(item.price);
    const discountPercent = hasDiscount ? Math.round(((parseFloat(item.price) - parseFloat(item.discountPrice)) / parseFloat(item.price)) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#111111] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">

            {/* Top Navigation - Transparent overlap */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-end p-4 pointer-events-none">
                <button
                    onClick={onClose}
                    aria-label={t('public.close')}
                    className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md active:scale-95 transition-all pointer-events-auto"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 pb-24 sm:pb-32">
                {/* Hero Image */}
                {hasImage ? (
                    <div className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] bg-neutral-200 dark:bg-[#0C0C0C] relative shrink-0">
                        <img
                            src={item.imageUrl}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                        <div className="absolute bottom-5 left-5 flex flex-wrap gap-2 z-10">
                            {item.isFeatured && (
                                <span className="bg-amber-500/90 backdrop-blur-md text-white text-[12px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/20 uppercase tracking-widest">
                                    <Star className="w-4 h-4 fill-white" /> {t('public.featured')}
                                </span>
                            )}
                            {hasDiscount && (
                                <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[12px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 uppercase tracking-widest">
                                    <span>🏷️</span> {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="pt-24 sm:pt-32" />
                )}

                {/* Content Container */}
                <div className="max-w-2xl mx-auto w-full px-5 pt-8">
                    {/* Header: Title & Price */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {hasDiscount && !hasImage && (
                                    <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                        🏷️ {discountPercent}% {isAm ? 'ቅናሽ' : 'OFF'}
                                    </span>
                                )}
                                {item.isFeatured && !hasImage && (
                                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                        ⭐ {isAm ? 'ተመራጭ' : 'Featured'}
                                    </span>
                                )}
                            </div>
                            <h1 className={cn("text-[32px] sm:text-[36px] font-black text-neutral-950 dark:text-[#F5F5F5] leading-none tracking-tight", isAm && 'font-bold font-ethiopic')}>
                                {name}
                            </h1>
                        </div>

                        <div className="flex flex-col sm:items-end shrink-0 mt-1">
                            {hasDiscount ? (
                                <>
                                    <span className="text-[28px] sm:text-[32px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                                        {formatCurrency(item.discountPrice, item.currency)}
                                    </span>
                                    <span className="text-[16px] font-bold line-through text-neutral-400 dark:text-[#A3A3A3] mt-1">
                                        {formatCurrency(item.price, item.currency)}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[28px] font-black text-amber-600 dark:text-amber-400 leading-none" style={{ color: 'var(--color-accent-500, var(--color-brand-500, #D97706))' }}>
                                    {formatCurrency(item.price, item.currency)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {desc && (
                        <div className="mb-8">
                            <p className={cn("text-[17px] leading-relaxed text-neutral-600 dark:text-[#A3A3A3] font-medium", isAm && "font-ethiopic")}>
                                {desc}
                            </p>
                        </div>
                    )}

                    {/* Metadata Sections */}
                    {(ingredients || allergens) && (
                        <div className="space-y-6 mt-10">
                            {ingredients && (
                                <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-[#1A1A1A] border border-black/5 dark:border-[#2A2A2A]">
                                    <h4 className={cn("text-[12px] font-black tracking-widest text-neutral-500 dark:text-[#A3A3A3] uppercase mb-3 flex items-center gap-2", isAm && "font-ethiopic")}>
                                        <Info className="w-4 h-4" />
                                        {t('public.ingredients')}
                                    </h4>
                                    <p className={cn("text-[15px] text-neutral-800 dark:text-[#F5F5F5] leading-relaxed font-medium", isAm && "font-ethiopic")}>
                                        {ingredients}
                                    </p>
                                </div>
                            )}

                            {allergens && (
                                <div className="p-5 sm:p-6 rounded-2xl bg-red-50 dark:bg-[#1A0A0A] border border-red-100 dark:border-red-900/30 text-red-900 dark:text-red-200">
                                    <h4 className={cn("text-[12px] font-black tracking-widest uppercase mb-3 flex items-center gap-2 text-red-700 dark:text-red-400", isAm && "font-ethiopic")}>
                                        <AlertCircle className="w-4 h-4" />
                                        {t('public.allergens')}
                                    </h4>
                                    <p className={cn("text-[15px] leading-relaxed font-bold", isAm && "font-ethiopic")}>
                                        {allergens}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 z-20 pb-4 sm:pb-8 pt-10 px-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#111111] dark:via-[#111111]/95 pointer-events-none">
                <div className="max-w-xl mx-auto w-full pointer-events-auto">
                    {!item.isAvailable ? (
                        <button disabled className={cn("w-full py-4 sm:py-5 rounded-2xl bg-neutral-200 dark:bg-[#222222] text-neutral-500 dark:text-[#555555] font-black text-[16px] text-center shadow-lg border border-black/5 dark:border-white/5 cursor-not-allowed", isAm && "font-ethiopic")}>
                            {t('public.unavailable')}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className={cn("w-full py-4 sm:py-5 rounded-2xl bg-[color:var(--color-brand-500)] text-white font-black text-[16px] tracking-wide text-center shadow-lg shadow-[color:var(--color-brand-500)]/20 hover:opacity-90 active:scale-[0.98] transition-all", isAm && "font-ethiopic")}
                        >
                            {t('public.return_to_menu')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
