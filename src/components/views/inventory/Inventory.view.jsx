import { useTranslation } from 'react-i18next';
import { Typography } from '@heroui/react';

import { Header } from '@/components/ui';
import InventoryTable from './elements/InventoryTable';

function Inventory() {
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { t('common:pages.inventory') }
            </p>
          </Typography>
        </div>
      </Header>
      <InventoryTable />
    </div>
  );
}

export default Inventory;
