// Keep regional formatting separate from the language used by the catalogs.
export const DEFAULT_LANGUAGE = 'es';
export const AVAILABLE_LANGUAGES = [
  { id: 'es', label: 'Español', locale: 'es-MX' },
  { id: 'en', label: 'English', locale: 'en-US' },
];
export const LANGUAGE_STORAGE_KEY = 'moka_language';

export const normalizeLanguage = value => {
  const base = typeof value === 'string' ? value.trim().toLowerCase().split(/[-_]/)[0] : '';
  return AVAILABLE_LANGUAGES.some(item => item.id === base) ? base : DEFAULT_LANGUAGE;
};

export const getLocale = language => AVAILABLE_LANGUAGES.find(item => item.id === normalizeLanguage(language)).locale;

export const detectLanguage = (storage, navigator) => {
  try {
    const saved = storage?.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) return normalizeLanguage(saved);
  } catch {
    // Preferences remain usable when browser storage is unavailable.
  }
  const candidates = navigator?.languages?.length ? navigator.languages : [navigator?.language];
  const supported = candidates.find(value => AVAILABLE_LANGUAGES.some(item =>
    item.id === value?.toLowerCase().split(/[-_]/)[0]
  ));
  return normalizeLanguage(supported);
};

export const persistLanguage = (language, storage, document) => {
  const normalized = normalizeLanguage(language);
  // Updating the document must not depend on localStorage access succeeding.
  if (document?.documentElement) {
    document.documentElement.lang = normalized;
    document.documentElement.dir = 'ltr';
  }
  try { storage?.setItem(LANGUAGE_STORAGE_KEY, normalized); } catch { /* Storage can be blocked. */ }
};
