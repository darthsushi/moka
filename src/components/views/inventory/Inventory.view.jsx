import { Surface, Typography } from '@heroui/react';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import { Header/* , Table */ } from '@/components/ui';
import { InventoryTable } from './elements/InventoryTable';


function Inventory() {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <>
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { SYSTEM_LANG.PAGES.INVENTORY }
            </p>
          </Typography>
        </div>
      </Header>

      <section className="w-full max-w-275 m-auto p-1">
        <Surface variant="tertiary" className="rounded-4xl p-2">
          {/* <Table cols=[] /> */}
          <InventoryTable />
          {/* <div className="w-full h-20 grid grid-col bg-orange-400">
            code
            status
            visibility
            location (display_name)
            type
            vistas
            precio


            city
            country
            state
          </div> */}
        </Surface>
      </section>
    </>
  );
}

export default Inventory;
