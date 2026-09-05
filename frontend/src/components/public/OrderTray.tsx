import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface OrderTrayProps {
    totalCount: number;
    totalAmount: number;
    currency: string;
    isAm: boolean;
    onOpenModal: () => void;
}

export const OrderTray: React.FC<OrderTrayProps> = ({
    totalCount,
    totalAmount,
    currency,
    isAm,
    onOpenModal,
}) => {
    if (totalCount <= 0) return null;

    return (
        <aside
            aria-label={isAm ? 'ትዕዛዞቼ' : 'My Orders'}
            className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40 animate-fade-in-up"
        >
            <button
                type="button"
                onClick={onOpenModal}
                className="w-full bg-slate-900/95 dark:bg-black/95 hover:bg-slate-900 text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/50 border border-white/15 backdrop-blur-xl flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer group select-none"
            >
                {/* Left side: Cart Badge + Count + Subtotal */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl bg-[color:var(--color-brand-500)] text-white flex items-center justify-center shadow-md shadow-[color:var(--color-brand-500)]/30 shrink-0 group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-slate-950 text-[10px] font-black flex items-center justify-center shadow-xs">
                            {totalCount}
                        </span>
                    </div>

                    <div className="flex flex-col text-left min-w-0">
                        <span className={cn("text-xs font-bold text-slate-300 truncate", isAm && "font-ethiopic")}>
                            {isAm ? 'ትዕዛዞቼ' : 'My Orders'} ({totalCount})
                        </span>
                        <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight">
                            {formatCurrency(totalAmount, currency)}
                        </span>
                    </div>
                </div>

                {/* Right side: Action Pill */}
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 group-hover:bg-[color:var(--color-brand-500)] group-hover:text-white transition-all text-xs font-black text-white shrink-0">
                    <span className={cn(isAm && "font-ethiopic")}>
                        {isAm ? 'ትዕዛዞቼን ይመልከቱ' : 'My Orders'}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                </div>
            </button>
        </aside>
    );
};
