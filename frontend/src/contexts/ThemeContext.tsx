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
        if (!theme) return;
        applyRestaurantTheme(theme.primaryColor, theme.accentColor);
    }, [theme]);

    const applyTheme = (t: RestaurantTheme | null) => {
        if (t) applyRestaurantTheme(t.primaryColor, t.accentColor);
    };

    return <ThemeContext.Provider value={{ applyTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

