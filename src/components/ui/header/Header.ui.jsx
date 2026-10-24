import { useTranslation } from 'react-i18next';
import { Button, Separator, Tooltip } from '@heroui/react';

import { useUI } from '@/hooks/contexts';

import Icon from '../icons/Icon.ui';
import LanguageButton from './elements/LanguageButton';
import AvatarAccount from './elements/AvatarAccount';
import OwnerButton from './elements/OwnerButton';

function Header({ children, actions }) {
  const { t } = useTranslation();
  const { isSidebarOpen, toggleSidebar } = useUI();

  return (
    <header data-main-header className="w-full h-20 sticky flex justify-between top-0 gap-1 p-2 z-50 bg-background">
      <div data-header-left-controls className="h-full flex items-center gap-2 py-2">
        <Tooltip>
          <Button
            size="lg"
            aria-label={ t('common:a11y.toggleSidebar') }
            onPress={ toggleSidebar }
            variant="ghost"
            className="text-xl"
          >
            <Icon filled name="thumbnail-bar" />
          </Button>
          <Tooltip.Content>
            { isSidebarOpen ? t('common:tooltips.collapseSidebar') : t('common:tooltips.expandSidebar') }
          </Tooltip.Content>
        </Tooltip>
        <Separator orientation="vertical" />
        <div className="w-80 h-full overflow-hidden">
          { children }
        </div>
      </div>
      <div data-header-right-controls className="h-full flex items-center gap-1">
        { actions }
        <LanguageButton />
        <OwnerButton />
        <AvatarAccount />
      </div>
    </header>
  );
};

export default Header;
