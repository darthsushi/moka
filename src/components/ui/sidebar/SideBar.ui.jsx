import { useLocation, useNavigate } from 'react-router-dom';
import {
  Label,
  ListBox,
  Tooltip
} from '@heroui/react';

import { not } from '@/helpers/ramda.helpers';
import { canAccessModule, classNameParser } from '@/helpers/utilities.helpers';
import { useAuth, useLanguage, useUI } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';
import { NAVIGATION_ITEMS } from '@/settings/navigation.settings';

import Icon from '../icons/Icon.ui';
import Logo from '../brand/Logo.ui';
import FlatCard from '../containers/FlatCard.ui';

function SideBar() {
  const { isAuthenticated, roles } = useAuth();
  const { language } = useLanguage();
  const {
    isSidebarOpen,
  } = useUI();

  const location = useLocation();
  const navigate = useNavigate();

  const SIDEBAR_LANG = SYSTEM_LANG[language].SIDEBAR;

  const navigationItems = NAVIGATION_ITEMS.filter(
    item => canAccessModule(item, isAuthenticated, roles)
  );


  const SIDE_BAR_CLASS = [
    isSidebarOpen ? 'w-[280px] md:w-[350px]' : 'w-[50px] md:w-[100px]',
    'h-screen p-1 flex-col justify-between bg-background',
    'transition-all duration-100',
    'hidden  sm:flex'
  ];
  const LIST_ITEM_CLASS = [
    not(isSidebarOpen) && 'justify-center',
    'flex items-center'
  ];
  const ICON_CLASS = [
    isSidebarOpen ? 'text-xl' : 'w-full items-center text-2xl',
    'transition-all duration-200',
    'flex h-8 items-center justify-center',
    'text-black dark:text-white'
  ];
  const LABEL_CLASS = [
    isSidebarOpen ? 'opacity-100' : 'opacity-0',
    'flex flex-col',
    'transition-all duration-100',
  ];

  return (
    <nav className={ classNameParser(SIDE_BAR_CLASS) } >
      <div className="w-full h-auto flex flex-col items-center">
        <Logo small={ not(isSidebarOpen) } />
        <div className="w-full min-h-2 pt-2">
          <FlatCard
            className="w-full"
            variant="transparent"
          >
            <ListBox
              aria-label="side-bar"
              className="w-full p-2 text-gray-600"
              selectionMode="none"
              onAction={ (key) => navigate(String(key)) }
            >
              <ListBox.Section className="flex flex-col gap-1">
                { 
                  navigationItems.map(item => {
                    const label = SIDEBAR_LANG[item.label];
                    const isActive = location.pathname === item.path;

                    return (
                      <ListBox.Item
                        key={ item.id }
                        id={ item.path }
                        textValue={ label }
                        className={ 
                          classNameParser([
                            ...LIST_ITEM_CLASS,
                            isActive && 'bg-default'
                          ])
                        }
                      >
                        <Tooltip isDisabled={ isSidebarOpen }>
                          <Tooltip.Trigger>
                            <div
                              className={ classNameParser(ICON_CLASS) }
                            >
                              <Icon
                                filled
                                name={ item.icon }
                              />
                            </div>
                          </Tooltip.Trigger>
                          <Tooltip.Content
                            placement="left"
                          >
                            { label }
                          </Tooltip.Content>
                        </Tooltip>
                        { isSidebarOpen &&
                          <div className={ classNameParser(LABEL_CLASS) }>
                            <Label className="text-base">
                              { label }
                            </Label>
                          </div>
                        }
                      </ListBox.Item>
                    );
                  }) 
                }
              </ListBox.Section>
            </ListBox>
          </FlatCard>
        </div>
      </div>
    </nav>
  );
}

export default SideBar;