import { Typography } from '@heroui/react';
import { Header } from '@/components/ui';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

function ReviewHubView() {
  const { language } = useLanguage();
  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <div className="flex flex-col">
      <Header>
        <div className="w-full h-full flex items-center">
          <Typography type="h4" className="truncate">
            <p className="truncate">
              { SYSTEM_LANG.PAGES.REVIEW_HUB }
            </p>
          </Typography>
        </div>
      </Header>
      aqui va el contenido del review hub
    </div>
  );
}

export default ReviewHubView;