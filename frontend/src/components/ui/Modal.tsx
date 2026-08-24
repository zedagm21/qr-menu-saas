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
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className,
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
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px] animate-fade-in" />

            {/* Panel */}
            <div
                className={cn(
                    'relative w-full bg-white dark:bg-neutral-900 rounded-2xl',
                    'shadow-[0_24px_80px_rgba(0,0,0,0.18)]',
                    'animate-scale-in overflow-hidden',
                    'border border-neutral-100 dark:border-neutral-800',
                    sizes[size],
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <h2 className="text-[17px] font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className={[
                                'p-2 rounded-xl transition-all duration-150',
                                'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                                'active:scale-90',
                            ].join(' ')}
                            aria-label={t('public.close')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto max-h-[85vh]">{children}</div>
            </div>
        </div>
    );
};
