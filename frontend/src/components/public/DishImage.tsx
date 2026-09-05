import React, { useState } from 'react';
import { Utensils } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DishImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    alt: string;
    className?: string;
    containerClassName?: string;
    fallbackIcon?: React.ReactNode;
}

export const DishImage: React.FC<DishImageProps> = ({
    src,
    alt,
    className,
    containerClassName,
    fallbackIcon,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className={cn("w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 select-none", containerClassName)}>
                {fallbackIcon || <Utensils className="w-5 h-5 opacity-40" />}
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden w-full h-full bg-neutral-100 dark:bg-neutral-800", containerClassName)}>
            {/* Pulse Shimmer Placeholder */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0",
                    className
                )}
                {...props}
            />
        </div>
    );
};
