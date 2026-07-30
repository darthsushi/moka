/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';

import { isNil, not } from '@/helpers/ramda.helpers';
import { THEME as DEFAULT_THEME } from '@/settings/defaults.settings';
import { STORAGE } from '@/settings/keys.settings';

export const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE.THEME) || DEFAULT_THEME;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return (localStorage.getItem(STORAGE.SIDEBAR) === 'true') || false;
  });
  const [isMapOpen, setIsMapOpen] = useState(() => {
    return (localStorage.getItem(STORAGE.DASH_MAP) === 'true') || false;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFormIds, setPendingFormIds] = useState([]);

  useEffect(() => {
    localStorage.setItem(STORAGE.THEME, theme);

    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE.SIDEBAR, isSidebarOpen);
  }, [isSidebarOpen]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => not(prevState));
  };

  const toggleMap = () => {
    setIsMapOpen(prevState => not(prevState));
  };

  const setFormPending = (formId, isPending = true) => {
    if (not(isPending) && isNil(pendingFormIds[formId])) {
      return;
    }

    if (not(isPending)) {
      setPendingFormIds((prevIds) => prevIds.filter(id => id !== formId));
    }

    setPendingFormIds((prevIds) => {
      if (prevIds.includes(formId)) return prevIds;

      return [...prevIds, formId];
    });
  };

  const value = {
    theme,
    toggleTheme,
    isLoading,
    setIsLoading,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    isMapOpen,
    setIsMapOpen,
    toggleMap,
    setFormPending,
    pendingFormIds
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};