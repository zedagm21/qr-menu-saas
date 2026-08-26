import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import am from './locales/am.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            am: { translation: am },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'ui-language',
        },
    });

// Sync document language attribute on init & language change
const syncDocumentLang = (lng: string) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lng;
        document.documentElement.dir = 'ltr'; // Amharic is LTR
    }
};

syncDocumentLang(i18n.language || 'en');
i18n.on('languageChanged', (lng) => {
    syncDocumentLang(lng);
});

export default i18n;

export const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', flag: '🇪🇹' },
] as const;

export type LanguageCode = 'en' | 'am';
