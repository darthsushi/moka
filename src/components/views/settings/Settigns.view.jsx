import { Card, Typography } from '@heroui/react';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import { Header } from '@/components/ui';

import Account from './elements/Account';


function Settings() {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <div className="flex flex-col">
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { SYSTEM_LANG.PAGES.SETTINGS }
            </p>
          </Typography>
        </div>
      </Header>
      <div className="w-full h-auto pt-4 p-2">
        <div className="w-full max-w-300 m-auto grid grid-cols-6 gap-2">
          <div aria-label="settings-aside" className="col-span-2 p-1 grid grid-cols-1 h-fit">
            <Card variant="secondary" className="rounded-4xl">
              <Account />
            </Card>
          </div>
          <div aria-label="settings-content" className="col-span-4 p-1 grid grid-cols-1 h-fit">
            <Card  variant="secondary" className="rounded-4xl">
              <ul>
                <li>Si no hay sesion, invitar a iniciar o crear</li>
                <li>Si hay sesion, mostrar ajustes de usuario</li>
                <li>No importa la sesion: Idioma</li>
                <li>No importa la sesion: Theme</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
