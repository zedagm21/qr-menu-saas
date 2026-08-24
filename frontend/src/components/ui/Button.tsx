import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}) => {
    const base = [
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        'active:scale-[0.97]',
    ].join(' ');

    const variants: Record<string, string> = {
        // Gradient primary using brand → accent, with glow on hover
        primary: [
            'text-white shadow-sm',
            'bg-[color:var(--color-brand-500)]',
            'hover:brightness-110',
            'focus-visible:ring-[color:var(--color-brand-500)]',
        ].join(' '),
        // Dark neutral secondary
        secondary: [
            'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm',
            'hover:bg-neutral-800 dark:hover:bg-white hover:shadow-md',
            'focus-visible:ring-neutral-500',
        ].join(' '),
        // Border outline with brand tint on hover
        outline: [
            'border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900',
            'text-neutral-700 dark:text-neutral-200',
            'hover:border-[color:var(--color-brand-300)] hover:bg-[color:var(--color-brand-50)] hover:text-[color:var(--color-brand-700)]',
            'dark:hover:border-[color:var(--color-brand-700)] dark:hover:bg-[color:var(--color-brand-900)]/20',
            'focus-visible:ring-[color:var(--color-brand-400)]',
        ].join(' '),
        // Ghost no background
        ghost: [
            'text-neutral-600 dark:text-neutral-400',
            'hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
            'focus-visible:ring-neutral-400',
        ].join(' '),
        // Danger red
        danger: [
            'bg-red-600 text-white shadow-sm',
            'hover:bg-red-700 hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)]',
            'focus-visible:ring-red-500',
        ].join(' '),
    };

    const sizes: Record<string, string> = {
        sm: 'h-9 px-3.5 text-[13px]',
        md: 'h-11 px-5 text-[14px]',
        lg: 'h-12 px-7 text-[15px]',
    };

    return (
        <button
            className={cn(base, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
                icon && <span className="shrink-0">{icon}</span>
            )}
            {children}
        </button>
    );
};
