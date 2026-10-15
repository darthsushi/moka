import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources.js';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, detectLanguage, normalizeLanguage, persistLanguage } from './languages.js';

// Accessing localStorage itself can throw in privacy-restricted browsers.
let storage;
try { storage = globalThis.localStorage; } catch { /* Use in-memory preferences. */ }

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(storage, globalThis.navigator),
  supportedLngs: AVAILABLE_LANGUAGES.map(item => item.id),
  fallbackLng: DEFAULT_LANGUAGE,
  load: 'languageOnly',
  defaultNS: 'common',
  ns: Object.keys(resources[DEFAULT_LANGUAGE]),
  initAsync: false,
  returnNull: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false }, // React escapes text nodes.
  react: { useSuspense: false },
  saveMissing: Boolean(import.meta.env?.DEV),
  missingKeyHandler: (_languages, namespace, key) => {
    console.warn(`[i18n] Missing translation: ${namespace}:${key}`);
  },
});

const syncLanguage = language => persistLanguage(language, storage, globalThis.document);
i18n.on('languageChanged', syncLanguage);
syncLanguage(i18n.resolvedLanguage);

export const changeLanguage = language => i18n.changeLanguage(normalizeLanguage(language));
export default i18n;
