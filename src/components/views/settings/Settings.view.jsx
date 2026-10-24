import { useTranslation } from 'react-i18next';
import { Card } from '@heroui/react';

import { Header, HeaderTitle } from '@/components/ui';

import Account from './elements/AccountSettings';
import SystemSettings from './elements/SystemSettings';

function Settings() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <Header>
        <HeaderTitle title={ t('common:pages.settings') } />
      </Header>
      <div className="w-full h-auto pt-4 p-2">
        <div className="grid grid-cols-6 gap-2 mx-auto w-full max-w-300 p-4 sm:p-6 lg:p-8">
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
