import { useState, useEffect } from 'react';

export interface NetworkStatus {
    isOnline: boolean;
    wasOffline: boolean;
}

/**
 * Hook to track real-time internet connectivity status for diners.
 * Detects online/offline browser state and flags when connection is restored.
 */
export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
            ? navigator.onLine
            : true;
    });

    const [wasOffline, setWasOffline] = useState<boolean>(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setWasOffline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, wasOffline };
}
