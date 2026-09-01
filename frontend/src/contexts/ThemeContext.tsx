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
        const primary = theme?.primaryColor || '#D97706';
        const accent = theme?.accentColor || '#F59E0B';
        applyRestaurantTheme(primary, accent);
    }, [theme]);

    const applyTheme = (t: RestaurantTheme | null) => {
        const primary = t?.primaryColor || '#D97706';
        const accent = t?.accentColor || '#F59E0B';
        applyRestaurantTheme(primary, accent);
    };

    return <ThemeContext.Provider value={{ applyTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

