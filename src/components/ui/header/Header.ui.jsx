import { Button, Separator, Tooltip } from '@heroui/react';

import { useLanguage, useUI } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import Icon from '../icons/Icon.ui';
import LanguageButton from './elements/LanguageButton';
import AvatarAccount from './elements/AvatarAccount';
import OwnerButton from './elements/OwnerButton';

function Header({ children }) {
  const { language } = useLanguage();
  const { isSidebarOpen, toggleSidebar } = useUI();

  const SYSTEM_LANG = SYSTEM_LANGS[language];
  
  return (
    <header data-main-header className="w-full h-20 sticky flex justify-between top-0 gap-1 p-2 z-50 bg-background">
      <div data-header-left-controls className="h-full flex items-center gap-2 py-2">
        <Tooltip>
          <Button
            size="lg"
            aria-label="toogle sidebar"
            onPress={ toggleSidebar }
            variant="ghost"
            className="text-xl"
          >
            <Icon filled name="thumbnail-bar" />
          </Button>
          <Tooltip.Content>
            { isSidebarOpen ? SYSTEM_LANG.TOOLTIPS.COLLAPSE_SIDEBAR : SYSTEM_LANG.TOOLTIPS.EXPAND_SIDEBAR }
          </Tooltip.Content>
        </Tooltip>
        <Separator orientation="vertical" />
        <div className="w-80 h-full overflow-hidden">
          { children }
        </div>
      </div>
      <div data-header-right-controls className="h-full flex items-center gap-1">
        <LanguageButton />
        <OwnerButton />
        <AvatarAccount />
      </div>
    </header>
  );
};

export default Header;
