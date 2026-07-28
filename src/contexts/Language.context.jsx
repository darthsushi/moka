/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';

import { LANG as DEFAULT_LANG } from '../settings/defaults.settings';
import { STORAGE } from '../settings/keys.settings';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    try {
      const item = window.localStorage.getItem(STORAGE.LANGUAGE);
      if (item) return item;

      const browserLang = window.navigator.language;
      return browserLang ? browserLang.split('-')[0] : DEFAULT_LANG;
    } catch (error) {
      console.warn("Error leyendo el localStorage", error);
      return DEFAULT_LANG;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE.LANGUAGE, language);
      document.documentElement.lang = language;
    } catch (error) {
      console.warn("Error guardando en localStorage", error);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      { children }
    </LanguageContext.Provider>
  );
};
