import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useUnsavedPrompt(isModified: boolean) {
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);
    const navigate = useNavigate();

    // Prevent tab close or page reload when modified
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isModified) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isModified]);

    // Intercept internal link clicks when modified
    useEffect(() => {
        if (!isModified) return;

        const handleAnchorClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (!href || href.startsWith('#') || target.target === '_blank' || href.startsWith('blob:') || href.startsWith('tel:') || href.startsWith('mailto:')) {
                return;
            }

            // If navigating away from the current path
            if (href !== window.location.pathname) {
                e.preventDefault();
                e.stopPropagation();
                setPendingNavHref(href);
                setShowUnsavedModal(true);
            }
        };

        document.addEventListener('click', handleAnchorClick, true);
        return () => document.removeEventListener('click', handleAnchorClick, true);
    }, [isModified]);

    const stayOnPage = useCallback(() => {
        setShowUnsavedModal(false);
        setPendingNavHref(null);
    }, []);

    const proceedNavigation = useCallback((targetUrl?: string) => {
        const destination = targetUrl || pendingNavHref;
        setPendingNavHref(null);
        setShowUnsavedModal(false);
        if (destination) {
            navigate(destination);
        }
    }, [pendingNavHref, navigate]);

    return {
        showUnsavedModal,
        setShowUnsavedModal,
        pendingNavHref,
        setPendingNavHref,
        stayOnPage,
        proceedNavigation,
    };
}
