import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from '@/contexts/Auth.context.jsx';
import { LanguageProvider } from '@/contexts/Language.context.jsx';
import { UIProvider } from '@/contexts/UI.context.jsx';

import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIProvider>
      <AuthProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </UIProvider>
  </StrictMode>,
);
