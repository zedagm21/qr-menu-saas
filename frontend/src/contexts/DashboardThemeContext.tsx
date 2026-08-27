import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface DashboardThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const DashboardThemeContext = createContext<DashboardThemeContextType | undefined>(undefined);

export const DashboardThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('dashboard-theme');
        return (stored as Theme) || 'auto';
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('dashboard-theme', newTheme);
    };

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            root.classList.remove('light', 'dark');

            const isDark = theme === 'auto'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                : theme === 'dark';

            root.classList.add(isDark ? 'dark' : 'light');
            root.style.colorScheme = isDark ? 'dark' : 'light';
        };

        applyTheme();

        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme();

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return (
        <DashboardThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </DashboardThemeContext.Provider>
    );
};

export const useDashboardTheme = () => {
    const context = useContext(DashboardThemeContext);
    if (context === undefined) {
        throw new Error('useDashboardTheme must be used within a DashboardThemeProvider');
    }
    return context;
};
