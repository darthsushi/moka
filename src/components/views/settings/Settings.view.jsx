import { useTranslation } from 'react-i18next';
import { Card, Typography } from '@heroui/react';

import { Header } from '@/components/ui';

import Account from './elements/AccountSettings';
import SystemSettings from './elements/SystemSettings';

function Settings() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { t('common:pages.settings') }
            </p>
          </Typography>
        </div>
      </Header>
      <div className="w-full h-auto pt-4 p-2">
        <div className="w-full max-w-300 m-auto grid grid-cols-6 gap-2">
          <div aria-label={ t('common:pages.settings') } className="col-span-2 p-1 grid grid-cols-1 h-fit">
            <Card>
              <Account />
            </Card>
          </div>
          <div aria-label={ t('common:pages.settings') } className="col-span-4 p-1 grid grid-cols-1 h-fit">
            <section className="w-full">
              <SystemSettings />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
