import { useTranslation } from 'react-i18next';

import { Header, HeaderTitle } from '@/components/ui';
import InventoryTable from './elements/InventoryTable';

function Inventory() {
  const { t } = useTranslation();

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <HeaderTitle title={ t('common:pages.inventory') } />
      </Header>
      <InventoryTable />
    </div>
  );
}

export default Inventory;
