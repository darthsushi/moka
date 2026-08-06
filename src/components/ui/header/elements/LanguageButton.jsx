import { Button, Header, Dropdown, Label, Tooltip } from '@heroui/react';

import {
  AVAILABLE_LANGUAGES,
  SYSTEM as SYSTEM_LANG
} from '@/settings/langs.settings';
import { useLanguage } from '@/hooks/contexts';

import Icon from '../../icons/Icon.ui';

function LanguageButton() {
  const { language, setLanguage } = useLanguage();

  const SYSTEM_LABELS = SYSTEM_LANG[language];

  return (
    <Dropdown>
      <Tooltip>
        <Button
          size="lg"
          variant="outline"
          aria-label="Menu"
          className="text-xl"
        >
          <Icon name='language' />
        </Button>
        <Tooltip.Content>
          { SYSTEM_LABELS.TEXTS.CHOCE_LANGUAGE }
        </Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover className="min-w-[256px]">
        <Dropdown.Menu
          selectedKeys={ [language] }
          selectionMode="single"
          onSelectionChange={ ([lang]) => setLanguage(lang) }
        >
          <Dropdown.Section>
            <Header>
              { SYSTEM_LABELS.TEXTS.CHOCE_LANGUAGE }
            </Header>
            { 
              AVAILABLE_LANGUAGES.map((availableLanguage) => {
                return (
                  <Dropdown.Item
                    key={ availableLanguage.id }
                    id={ availableLanguage.id }
                    textValue={ availableLanguage.label }
                  >
                    <Dropdown.ItemIndicator />
                    <Label>{ availableLanguage.label }</Label>
                  </Dropdown.Item>
                );
              })
            }
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export default LanguageButton;