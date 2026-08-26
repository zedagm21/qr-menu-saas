/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Noto Sans Ethiopic', 'Nyala', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'serif'],
                ethiopic: ['Noto Sans Ethiopic', 'Nyala', 'sans-serif'],
                ethiopicSerif: ['Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'Nyala', 'serif'],
            },
            colors: {
                brand: {
                    50: 'var(--color-brand-50)',
                    100: 'var(--color-brand-100)',
                    200: 'var(--color-brand-200)',
                    300: 'var(--color-brand-300)',
                    400: 'var(--color-brand-400)',
                    500: 'var(--color-brand-500)',
                    600: 'var(--color-brand-600)',
                    700: 'var(--color-brand-700)',
                    800: 'var(--color-brand-800)',
                    900: 'var(--color-brand-900)',
                },
                accent: {
                    50: 'var(--color-accent-50)',
                    100: 'var(--color-accent-100)',
                    500: 'var(--color-accent-500)',
                    600: 'var(--color-accent-600)',
                },
            },
            animation: {
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shimmer': 'shimmer 1.6s infinite linear',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            },
            keyframes: {
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(40px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 var(--color-brand-500, #D97706)' },
                    '50%': { boxShadow: '0 0 16px 4px color-mix(in srgb, var(--color-brand-500, #D97706) 30%, transparent)' },
                },
                bounceIn: {
                    '0%': { opacity: '0', transform: 'scale(0.8)' },
                    '60%': { opacity: '1', transform: 'scale(1.04)' },
                    '100%': { transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
};
