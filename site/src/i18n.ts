import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

export const languageStorageKey = 'atom-humans-language';
export const supportedLanguages = ['en', 'tr'] as const;
export type Language = typeof supportedLanguages[number];

function initialLanguage(): Language {
  try {
    return localStorage.getItem(languageStorageKey) === 'tr' ? 'tr' : 'en';
  } catch {
    return 'en';
  }
}

function updateDocument(language: string) {
  const selected: Language = language === 'tr' ? 'tr' : 'en';
  document.documentElement.lang = selected;
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18next.t('meta.description', { lng: selected }));
  try {
    localStorage.setItem(languageStorageKey, selected);
  } catch {
    // Language switching still works when storage is unavailable.
  }
}

i18next.on('languageChanged', updateDocument);

export const i18nReady = i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, tr: { translation: tr } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...supportedLanguages],
  interpolation: { escapeValue: false },
});

export default i18next;
