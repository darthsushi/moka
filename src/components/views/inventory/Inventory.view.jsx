import { Typography } from '@heroui/react';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import { Header,/* , Table */ } from '@/components/ui';
import InventoryTable from './elements/InventoryTable';


function Inventory() {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { SYSTEM_LANG.PAGES.INVENTORY }
            </p>
          </Typography>
        </div>
      </Header>
      <InventoryTable />
    </div>
  );
}

export default Inventory;
