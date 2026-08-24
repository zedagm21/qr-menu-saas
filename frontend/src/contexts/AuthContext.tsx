import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import type { User, Restaurant } from '../types';

interface AuthContextType {
    user: User | null;
    restaurant: Restaurant | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string; restaurantName: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAuth = useCallback(async () => {
        try {
            const data = await authApi.me();
            setUser(data.user);
            setRestaurant(data.restaurant);
        } catch {
            setUser(null);
            setRestaurant(null);
        }
    }, []);

    useEffect(() => {
        refreshAuth().finally(() => setIsLoading(false));
    }, [refreshAuth]);

    const login = async (email: string, password: string) => {
        const data = await authApi.login({ email, password });
        setUser(data.user);
        setRestaurant(data.restaurant);
    };

    const register = async (data: { name: string; email: string; password: string; restaurantName: string }) => {
        const result = await authApi.register(data);
        setUser(result.user);
        setRestaurant(result.restaurant);
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
        setRestaurant(null);
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        await authApi.updatePassword({ currentPassword, newPassword });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                restaurant,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshAuth,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
