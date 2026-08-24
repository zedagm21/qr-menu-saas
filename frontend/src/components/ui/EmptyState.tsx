import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className,
}) => (
    <div
        className={cn(
            'flex flex-col items-center justify-center text-center py-16 px-6',
            className
        )}
    >
        {icon && (
            <div className="w-16 h-16 rounded-full bg-neutral-50 shadow-sm border border-neutral-100 flex items-center justify-center text-neutral-400 mb-5 text-3xl">
                {icon}
            </div>
        )}
        <h3 className="text-lg font-bold text-neutral-900 mb-1.5">{title}</h3>
        {description && (
            <p className="text-[15px] text-neutral-500 max-w-sm mb-6 leading-relaxed bg-white/50">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
    </div>
);
