import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    dot?: boolean;
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'sm',
    dot = false,
    children,
    className,
}) => {
    const variants: Record<string, string> = {
        default: 'bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40',
        success: 'bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/40',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200/80 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/40',
        danger: 'bg-red-100 text-red-800 border-red-200/80 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/40',
        info: 'bg-blue-100 text-blue-800 border-blue-200/80 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40',
        neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700/40',
    };

    const dotColors: Record<string, string> = {
        default: 'bg-amber-500',
        success: 'bg-emerald-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        info: 'bg-blue-500',
        neutral: 'bg-neutral-400',
    };

    const sizes: Record<string, string> = {
        sm: 'text-[11px] px-2 py-0.5 gap-1',
        md: 'text-xs px-2.5 py-1 gap-1.5',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center font-semibold rounded-full border',
                'shadow-sm',
                variants[variant],
                sizes[size],
                className
            )}
        >
            {dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
            )}
            {children}
        </span>
    );
};
