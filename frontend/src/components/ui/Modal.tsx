import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    fullScreenOnMobile?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className,
    fullScreenOnMobile = false,
}) => {
    const { t } = useTranslation();
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes: Record<string, string> = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-fade-in" />

            {/* Adaptive Bottom Sheet / Desktop Panel */}
            <div
                className={cn(
                    'relative w-full bg-white dark:bg-neutral-900',
                    'rounded-t-[28px] sm:rounded-2xl',
                    'shadow-[0_24px_80px_rgba(0,0,0,0.25)]',
                    'animate-sheet-up sm:animate-scale-in overflow-hidden',
                    'border-t sm:border border-neutral-200/80 dark:border-neutral-800',
                    'flex flex-col',
                    fullScreenOnMobile ? 'h-[95dvh] sm:h-auto' : 'max-h-[92dvh] sm:max-h-[85vh]',
                    sizes[size],
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {/* Mobile drag handle indicator */}
                <div className="flex sm:hidden justify-center pt-3 pb-1 cursor-grab">
                    <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </div>

                {title && (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                        <h2 className="text-[15px] sm:text-[17px] font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-90 transition-all cursor-pointer"
                            aria-label={t('public.close')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto flex-1 overscroll-contain pb-safe">{children}</div>
            </div>
        </div>
    );
};
