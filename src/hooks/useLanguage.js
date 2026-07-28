import { useContext } from 'react';
import { LanguageContext } from '../contexts/Language.context';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === null) {
    throw new Error('useLanguage debe ser usado dentro de un LanguageProvider');
  }
  
  return context;
};
