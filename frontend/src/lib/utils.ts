import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '../i18n';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: string | number, currency: string = 'ETB'): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currCode = currency || 'ETB';
    const localizedCurrency = (currCode.toUpperCase() === 'ETB')
        ? i18n.t('currency.code', { defaultValue: 'ETB' })
        : i18n.t(`currency.${currCode}`, { defaultValue: currCode });
    if (isNaN(num)) return `0 ${localizedCurrency}`;
    return `${num.toLocaleString('en-ET', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${localizedCurrency}`;
};

export const getTranslation = (
    translations: Array<{
        language: string;
        name: string;
        description?: string | null;
        ingredients?: string | null;
        allergens?: string | null;
        address?: string | null;
        city?: string | null;
    }>,
    lang: string,
    field: 'name' | 'description' | 'ingredients' | 'allergens' | 'address' | 'city' = 'name'
): string => {
    if (!translations || translations.length === 0) return '';
    const langUpper = lang.toUpperCase();
    const fallbackLang = langUpper === 'AM' ? 'EN' : 'AM';
    const found = translations.find(t => t.language === langUpper) || translations.find(t => t.language === fallbackLang);
    return (found ? found[field] : '') ?? '';
};

export const slugify = (text: string): string =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const applyRestaurantTheme = (primaryColor: string, accentColor: string) => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-500', primaryColor);
    root.style.setProperty('--color-accent-500', accentColor);

    // Derive palette from primary color
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Generate lighter/darker variants
    root.style.setProperty('--color-brand-600', shadeColor(primaryColor, -10));
    root.style.setProperty('--color-brand-700', shadeColor(primaryColor, -20));
    root.style.setProperty('--color-brand-400', shadeColor(primaryColor, 15));
    root.style.setProperty('--color-brand-300', shadeColor(primaryColor, 30));
    root.style.setProperty('--color-brand-100', `rgba(${r},${g},${b},0.1)`);
    root.style.setProperty('--color-brand-50', `rgba(${r},${g},${b},0.05)`);
};

function shadeColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
