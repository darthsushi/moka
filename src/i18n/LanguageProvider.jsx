import { I18nProvider } from 'react-aria';
import { useTranslation } from 'react-i18next';
import { getLocale } from './languages.js';

export default function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  return <I18nProvider locale={ getLocale(i18n.resolvedLanguage) }>{ children }</I18nProvider>;
}
