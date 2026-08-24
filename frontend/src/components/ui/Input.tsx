import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/* ─── Input ─────────────────────────────────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full h-11 px-4 border rounded-xl text-[15px] transition-all duration-200',
                        'bg-white dark:bg-neutral-900',
                        'text-neutral-900 dark:text-neutral-100',
                        'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
                        'outline-none',
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/40'
                            : [
                                'border-neutral-200 dark:border-neutral-700',
                                'focus:border-[color:var(--color-brand-500)]',
                                'focus:ring-2 focus:ring-[color:var(--color-brand-500)]/20',
                            ].join(' '),
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                {hint && !error && <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

/* ─── Textarea ──────────────────────────────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full px-4 py-3 border rounded-xl text-[15px] transition-all duration-200 resize-none min-h-[120px]',
                        'bg-white dark:bg-neutral-900',
                        'text-neutral-900 dark:text-neutral-100',
                        'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
                        'outline-none',
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/40'
                            : [
                                'border-neutral-200 dark:border-neutral-700',
                                'focus:border-[color:var(--color-brand-500)]',
                                'focus:ring-2 focus:ring-[color:var(--color-brand-500)]/20',
                            ].join(' '),
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                {hint && !error && <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

/* ─── Select ────────────────────────────────────────────────────────────────── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full h-11 px-4 border rounded-xl text-[15px] transition-all duration-200 appearance-none cursor-pointer',
                        'bg-white dark:bg-neutral-900',
                        'text-neutral-900 dark:text-neutral-100',
                        'outline-none',
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : [
                                'border-neutral-200 dark:border-neutral-700',
                                'focus:border-[color:var(--color-brand-500)]',
                                'focus:ring-2 focus:ring-[color:var(--color-brand-500)]/20',
                            ].join(' '),
                        className
                    )}
                    {...props}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
        );
    }
);
Select.displayName = 'Select';
