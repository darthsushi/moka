import { changeLanguage } from '@/i18n';
import { AVAILABLE_LANGUAGES } from '@/i18n/languages';
import { useTranslation } from 'react-i18next';
import { Button, Header, Dropdown, Label, Tooltip } from '@heroui/react';

import Icon from '../../icons/Icon.ui';

function LanguageButton() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;

  return (
    <Dropdown>
      <Tooltip>
        <Button
          size="lg"
          variant="outline"
          aria-label={ t('common:language.choose') }
          className="text-xl"
        >
          <Icon name='language' />
        </Button>
        <Tooltip.Content>
          { t('common:language.choose') }
        </Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover className="min-w-[256px]">
        <Dropdown.Menu
          selectedKeys={ [language] }
          selectionMode="single"
          onSelectionChange={ ([lang]) => changeLanguage(lang) }
        >
          <Dropdown.Section>
            <Header>
              { t('common:language.choose') }
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
