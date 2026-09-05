import React, { useState, useEffect } from 'react';
import {
    X,
    Trash2,
    Plus,
    Minus,
    Eye,
    ArrowLeft
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import type { OrderTab } from '../../types/order';
import type { Restaurant } from '../../types';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    tab: OrderTab;
    onUpdateQuantity: (itemId: string, delta: number) => void;
    onRemoveItem: (itemId: string) => void;
    onClearTab: () => void;
    restaurant: Restaurant;
    initialTableNumber?: string | null;
    isAm: boolean;
}

export const OrderModal: React.FC<OrderModalProps> = ({
    isOpen,
    onClose,
    tab,
    onUpdateQuantity,
    onRemoveItem,
    onClearTab,
    restaurant,
    isAm,
}) => {
    const [isWaiterMode, setIsWaiterMode] = useState<boolean>(false);

    // Lock body scroll and listen for Escape key when modal is open
    useEffect(() => {
        if (!isOpen) {
            setIsWaiterMode(false);
            return;
        }

        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isWaiterMode) {
                    setIsWaiterMode(false);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isWaiterMode, onClose]);

    if (!isOpen) return null;

    const itemsList = Object.values(tab);
    const totalCount = itemsList.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAmount = itemsList.reduce((acc, curr) => {
        const p = parseFloat(curr.item.discountPrice || curr.item.price || '0');
        return acc + (isNaN(p) ? 0 : p * curr.quantity);
    }, 0);

    const currency = restaurant.currency || 'ETB';

    // ─── High Contrast Full-Screen Waiter Mode ───────────────────────────────
    if (isWaiterMode) {
        return (
            <div className="fixed inset-0 z-50 bg-black text-white p-6 flex flex-col justify-between overflow-y-auto animate-fade-in">
                <div>
                    {/* Top bar */}
                    <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setIsWaiterMode(false)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 text-white text-sm font-bold active:scale-95 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{isAm ? 'ተመለስ' : 'Back to My Orders'}</span>
                        </button>

                        <span className="text-xs uppercase tracking-widest font-black text-amber-400">
                            {isAm ? 'ለአስተናጋጅ ማሳያ' : 'WAITER VIEW'}
                        </span>
                    </div>

                    {/* Prominent Orders Banner (replacing Diner Tab) */}
                    <div className="bg-amber-500 text-slate-950 p-5 rounded-2xl text-center mb-6 shadow-xl">
                        <span className="text-xs uppercase font-black tracking-widest block opacity-80 mb-0.5">
                            {isAm ? 'የደንበኛ ትዕዛዝ' : 'CUSTOMER ORDER'}
                        </span>
                        <span className="text-4xl sm:text-5xl font-black tracking-tight">
                            {isAm ? 'ትዕዛዞች' : 'Orders'}
                        </span>
                    </div>

                    {/* Order Checklist */}
                    <div className="space-y-4">
                        <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold border-b border-white/10 pb-2">
                            {isAm ? 'የታዘዙ ምግቦች ዝርዝር' : 'Order Checklist'}
                        </h4>
                        <ul className="space-y-3">
                            {itemsList.map(({ item, quantity }) => (
                                <li
                                    key={item.id}
                                    className="p-3.5 rounded-xl bg-white/10 flex items-center justify-between gap-4 border border-white/15"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                                            {quantity}x
                                        </span>
                                        <span className={cn("text-lg font-black leading-snug", isAm && "font-ethiopic")}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-amber-300 shrink-0">
                                        {formatCurrency(
                                            parseFloat(item.discountPrice || item.price || '0') * quantity,
                                            currency
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Total Bar */}
                <div className="pt-6 border-t border-white/20 mt-8">
                    <div className="flex items-center justify-between text-2xl font-black mb-4">
                        <span>{isAm ? 'አጠቃላይ ድምር:' : 'Total Amount:'}</span>
                        <span className="text-amber-400">{formatCurrency(totalAmount, currency)}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsWaiterMode(false)}
                        className="w-full py-4 rounded-xl bg-white hover:bg-neutral-100 text-slate-950 text-base font-black text-center active:scale-95 transition-all shadow-lg cursor-pointer"
                    >
                        {isAm ? 'እሺ፣ ለአስተናጋጅ አሳይቻለሁ' : 'Done Showing Waiter'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Standard My Orders Modal ────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4 cursor-pointer"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={isAm ? 'ትዕዛዞቼ' : 'My Orders'}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Bar */}
                <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🛍️</span>
                        <h3 className={cn("text-lg font-black text-neutral-900 dark:text-white tracking-tight", isAm && "font-ethiopic")}>
                            {isAm ? 'ትዕዛዞቼ' : 'My Orders'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {totalCount} {isAm ? 'ምግቦች' : 'items'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {itemsList.length > 0 && (
                            <button
                                type="button"
                                onClick={onClearTab}
                                title={isAm ? 'ሁሉንም አጥፋ' : 'Clear orders'}
                                className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                    {itemsList.length === 0 ? (
                        <div className="py-12 text-center space-y-3">
                            <span className="text-4xl block">🍽️</span>
                            <p className={cn("text-sm font-bold text-neutral-600 dark:text-neutral-400", isAm && "font-ethiopic")}>
                                {isAm ? 'ምንም የታዘዘ ምግብ የለም' : 'You have no orders yet'}
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                {isAm ? 'ከሜኑው ውስጥ የሚፈልጉትን ምግብ ይጨምሩ' : 'Add dishes from the menu to build your order.'}
                            </p>
                        </div>
                    ) : (
                        /* Itemized Dish List */
                        <div className="space-y-3">
                            {itemsList.map(({ item, quantity }) => {
                                const priceNum = parseFloat(item.discountPrice || item.price || '0');
                                const lineTotal = priceNum * quantity;

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <h4 className={cn("text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate", isAm && "font-ethiopic")}>
                                                {item.name}
                                            </h4>
                                            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                                                {formatCurrency(priceNum, currency)} each
                                            </span>
                                        </div>

                                        {/* Stepper + Total */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateQuantity(item.id, -1)}
                                                    className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Minus className="w-3 h-3 stroke-[3]" />
                                                </button>
                                                <span className="w-6 text-center text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                                                    {quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateQuantity(item.id, 1)}
                                                    className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-3 h-3 stroke-[3]" />
                                                </button>
                                            </div>

                                            <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white min-w-[65px] text-right">
                                                {formatCurrency(lineTotal, currency)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Bottom Fixed Action Footer */}
                {itemsList.length > 0 && (
                    <div className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200/80 dark:border-neutral-800 space-y-3 shrink-0">
                        {/* Subtotal summary */}
                        <div className="flex items-center justify-between">
                            <span className={cn("text-sm font-bold text-neutral-600 dark:text-neutral-400", isAm && "font-ethiopic")}>
                                {isAm ? 'አጠቃላይ ድምር:' : 'Total Amount:'}
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                                {formatCurrency(totalAmount, currency)}
                            </span>
                        </div>

                        {/* Show to Waiter Button (Primary Action) */}
                        <button
                            type="button"
                            onClick={() => setIsWaiterMode(true)}
                            className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm sm:text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                        >
                            <Eye className="w-5 h-5 stroke-[2.5]" />
                            <span className={cn(isAm && "font-ethiopic")}>
                                {isAm ? 'ትዕዛዙን ለአስተናጋጅ አሳይ' : 'Show to Waiter'}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
