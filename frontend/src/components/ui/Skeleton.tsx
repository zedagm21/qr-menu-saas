import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
    className?: string;
    lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines }) => {
    if (lines && lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'skeleton rounded-lg h-4',
                            i === lines - 1 && 'w-3/4',
                            className
                        )}
                    />
                ))}
            </div>
        );
    }
    return <div className={cn('skeleton rounded-lg', className)} />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
    <div className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl p-5',
        'border border-neutral-100 dark:border-neutral-800 space-y-4',
        className
    )}>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
    </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-9 w-16 rounded-xl" />
            </div>
        ))}
    </div>
);
