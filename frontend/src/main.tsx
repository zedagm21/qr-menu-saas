import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardThemeProvider } from './contexts/DashboardThemeContext';
import App from './App';
import './i18n';
import './styles/globals.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HelmetProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <AuthProvider>
                        <DashboardThemeProvider>
                            <App />
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    style: {
                                        background: '#1a1a1a',
                                        color: '#fff',
                                        fontSize: '14px',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                    },
                                    success: {
                                        duration: 4000,
                                        iconTheme: { primary: '#10b981', secondary: '#fff' },
                                    },
                                    error: {
                                        duration: 5000,
                                        iconTheme: { primary: '#ef4444', secondary: '#fff' },
                                    },
                                }}
                            />
                        </DashboardThemeProvider>
                    </AuthProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </HelmetProvider>
    </React.StrictMode>
);
