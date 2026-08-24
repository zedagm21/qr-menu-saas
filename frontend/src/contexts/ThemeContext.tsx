import React, { createContext, useContext, useEffect } from 'react';
import { applyRestaurantTheme } from '../lib/utils';
import type { RestaurantTheme } from '../types';

interface ThemeContextType {
    applyTheme: (theme: RestaurantTheme | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({ applyTheme: () => { } });

export const ThemeProvider: React.FC<{ children: React.ReactNode; theme?: RestaurantTheme | null }> = ({
    children,
    theme,
}) => {
    useEffect(() => {
        const root = document.documentElement;

        const handleTheme = () => {
            if (!theme) return;

            // Re-apply CSS variables on switch
            applyRestaurantTheme(theme.primaryColor, theme.accentColor);

            // Fix Dark Mode actually triggering tailwind dark variants
            if (theme.darkMode === 'DARK') {
                root.classList.add('dark');
                root.style.colorScheme = 'dark';
            } else if (theme.darkMode === 'LIGHT') {
                root.classList.remove('dark');
                root.style.colorScheme = 'light';
            } else {
                // AUTO Mode
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                }
            }
        };

        handleTheme();

        // Listen for system changes if AUTO is selected
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme?.darkMode === 'AUTO') {
                handleTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            // On unmount (like leaving public menu to dashboard), revert to light mode
            // (Assuming dashboard is light by default, we strip the explicit overrides)
            root.classList.remove('dark');
            root.style.colorScheme = '';
        };
    }, [theme]);

    const applyTheme = (t: RestaurantTheme | null) => {
        if (t) applyRestaurantTheme(t.primaryColor, t.accentColor);
    };

    return <ThemeContext.Provider value={{ applyTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
