import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle2,
    XCircle,
    FolderInput,
    Percent,
    Trash2,
    X,
    Loader2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Category } from '../../types';
import { getTranslation, cn } from '../../lib/utils';

interface BatchActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onMakeAvailable: () => void;
    onMarkSoldOut: () => void;
    categories: Category[];
    onMoveCategory: (categoryId: string) => void;
    onApplyDiscount: (percent: number | null) => void;
    onDeleteSelected: () => void;
    isLoading?: boolean;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
    selectedCount,
    onClearSelection,
    onMakeAvailable,
    onMarkSoldOut,
    categories,
    onMoveCategory,
    onApplyDiscount,
    onDeleteSelected,
    isLoading = false,
}) => {
    const { t, i18n } = useTranslation();
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedTargetCat, setSelectedTargetCat] = useState<string>(categories[0]?.id || '');
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState<string>('15');

    if (selectedCount === 0) return null;

    const handleConfirmMove = () => {
        if (!selectedTargetCat) return;
        onMoveCategory(selectedTargetCat);
        setIsMoveModalOpen(false);
    };

    const handleConfirmDiscount = (percent: number | null) => {
        onApplyDiscount(percent);
        setIsDiscountModalOpen(false);
    };

    const discountPresets = [10, 15, 20, 25, 30, 50];

    return (
        <>
            {/* Floating Island Toolbar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-200">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-neutral-800/95 text-white backdrop-blur-xl border border-neutral-700/80 shadow-2xl overflow-x-auto hide-scrollbar">
                    {/* Selected Badge */}
                    <div className="flex items-center gap-2 pr-2 border-r border-neutral-700/80 shrink-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[color:var(--color-brand-500)] text-[12px] font-black text-white">
                            {selectedCount}
                        </span>
                        <span className="text-[13px] font-bold text-neutral-200 hidden md:inline whitespace-nowrap">
                            {t('menu_items.selected_count', { count: selectedCount, defaultValue: `${selectedCount} selected` })}
                        </span>
                        <button
                            type="button"
                            onClick={onClearSelection}
                            title={t('actions.cancel', { defaultValue: 'Clear selection' })}
                            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Action: Mark Available */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onMakeAvailable}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-[12px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="whitespace-nowrap">{t('menu_items.available', { defaultValue: 'Available' })}</span>
                    </button>

                    {/* Action: Mark Sold Out */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onMarkSoldOut}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white text-[12px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="whitespace-nowrap">{t('menu_items.sold_out', { defaultValue: 'Sold Out' })}</span>
                    </button>

                    {/* Action: Move Category */}
                    {categories.length > 1 && (
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                                setSelectedTargetCat(categories[0]?.id || '');
                                setIsMoveModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-[12px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            <FolderInput className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="whitespace-nowrap">{t('menu_items.move_category', { defaultValue: 'Move' })}</span>
                        </button>
                    )}

                    {/* Action: Discount */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => setIsDiscountModalOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-[12px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <Percent className="w-3.5 h-3.5 text-amber-400" />
                        <span className="whitespace-nowrap">{t('menu_items.discount', { defaultValue: 'Discount' })}</span>
                    </button>

                    {/* Action: Delete */}
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onDeleteSelected}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 text-[12px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span className="whitespace-nowrap">{t('actions.delete', { defaultValue: 'Delete' })}</span>
                    </button>

                    {isLoading && (
                        <div className="pl-1 shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin text-[color:var(--color-brand-400)]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Move Category Modal */}
            <Modal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                title={t('menu_items.move_category_title', { defaultValue: 'Move Items to Category' })}
                size="sm"
            >
                <div className="p-5 space-y-4">
                    <p className="text-[14px] text-neutral-600 dark:text-neutral-300">
                        {t('menu_items.move_category_desc', {
                            count: selectedCount,
                            defaultValue: `Choose destination category for ${selectedCount} selected items:`,
                        })}
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {categories.map((c) => (
                            <label
                                key={c.id}
                                className={cn(
                                    'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                                    selectedTargetCat === c.id
                                        ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-50)]/50 dark:bg-[color:var(--color-brand-500)]/10 font-bold text-neutral-900 dark:text-neutral-100'
                                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                                )}
                            >
                                <span className="text-[14px]">{getTranslation(c.translations, i18n.language)}</span>
                                <input
                                    type="radio"
                                    name="targetCategory"
                                    value={c.id}
                                    checked={selectedTargetCat === c.id}
                                    onChange={() => setSelectedTargetCat(c.id)}
                                    className="accent-[color:var(--color-brand-500)] w-4 h-4"
                                />
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>
                            {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button
                            variant="primary"
                            disabled={!selectedTargetCat || isLoading}
                            isLoading={isLoading}
                            onClick={handleConfirmMove}
                        >
                            {t('actions.confirm', { defaultValue: 'Move Items' })}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Discount Modal */}
            <Modal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                title={t('menu_items.batch_discount_title', { defaultValue: 'Apply Bulk Discount' })}
                size="sm"
            >
                <div className="p-5 space-y-5">
                    <p className="text-[14px] text-neutral-600 dark:text-neutral-300">
                        {t('menu_items.batch_discount_desc', {
                            count: selectedCount,
                            defaultValue: `Apply a discount percentage to ${selectedCount} selected items:`,
                        })}
                    </p>

                    {/* Quick % chips */}
                    <div className="flex flex-wrap gap-2">
                        {discountPresets.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setDiscountValue(p.toString())}
                                className={cn(
                                    'px-3 py-1.5 rounded-xl text-[13px] font-extrabold border transition-all cursor-pointer',
                                    discountValue === p.toString()
                                        ? 'border-[color:var(--color-brand-500)] bg-[color:var(--color-brand-500)] text-white shadow-sm'
                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                                )}
                            >
                                {p}% OFF
                            </button>
                        ))}
                    </div>

                    {/* Custom Input */}
                    <div>
                        <label className="text-[12px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                            {t('menu_items.custom_percent', { defaultValue: 'Or Enter Percentage (%)' })}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder="15"
                                className="w-full h-11 px-4 pr-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[15px] font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-500)]"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">%</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <Button
                            variant="primary"
                            disabled={!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0 || Number(discountValue) >= 100 || isLoading}
                            isLoading={isLoading}
                            onClick={() => handleConfirmDiscount(Number(discountValue))}
                            className="w-full"
                        >
                            {t('menu_items.apply_discount_btn', {
                                percent: discountValue,
                                defaultValue: `Apply ${discountValue}% Discount`,
                            })}
                        </Button>

                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleConfirmDiscount(null)}
                            className="text-[13px] font-bold text-red-600 dark:text-red-400 hover:underline py-1.5 text-center cursor-pointer transition-colors"
                        >
                            {t('menu_items.remove_discount_btn', { defaultValue: 'Remove Existing Discounts from Selected' })}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
