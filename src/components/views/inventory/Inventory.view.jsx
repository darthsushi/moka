import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs } from '@heroui/react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Header, HeaderTitle } from '@/components/ui';
import InventoryTable from './elements/InventoryTable';

const INVENTORY_TABS = {
  approved: ['approved'],
  reviewing: ['pending', 'in_review'],
  attention: ['rejected', 'suspended']
};

function Inventory() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const hashTab = hash.slice(1);
  const selectedTab = Object.hasOwn(INVENTORY_TABS, hashTab) ? hashTab : 'approved';

  useEffect(() => {
    if (hashTab !== selectedTab) {
      navigate({ hash: `#${selectedTab}` }, { replace: true });
    }
  }, [hashTab, navigate, selectedTab]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header>
        <HeaderTitle title={ t('common:pages.inventory') } />
      </Header>
      <Tabs
        selectedKey={ selectedTab }
        onSelectionChange={ key => navigate({ hash: `#${key}` }) }
        className="flex min-h-0 flex-1 flex-col"
      >
        <Tabs.ListContainer className="mx-3 w-fit">
          <Tabs.List aria-label={ t('common:pages.inventory') }>
            { Object.keys(INVENTORY_TABS).map(key =>
              <Tabs.Tab key={ key } id={ key }>
                { t(`inventory:tabs.${key}`) }
                <Tabs.Indicator />
              </Tabs.Tab>
            ) }
          </Tabs.List>
        </Tabs.ListContainer>
        { Object.entries(INVENTORY_TABS).map(([key, reviewStatuses]) =>
          <Tabs.Panel key={ key } id={ key } className="flex min-h-0 flex-1 flex-col">
            { selectedTab === key && <InventoryTable key={ key } reviewStatuses={ reviewStatuses } /> }
          </Tabs.Panel>
        ) }
      </Tabs>
    </div>
  );
}

export default Inventory;
