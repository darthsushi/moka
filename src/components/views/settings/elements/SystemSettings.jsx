import { changeLanguage } from '@/i18n';
import { AVAILABLE_LANGUAGES } from '@/i18n/languages';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Description,
  Header,
  ListBox,
  Select,
  Separator,
  ToggleButton,
  Tooltip
} from '@heroui/react';

import { useUI } from '@/hooks/contexts';

import { Icon } from '@/components/ui';

import { Label } from '@heroui/react';

function SystemSettings() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const { setTheme, theme } = useUI();

  return (
    <>
      <Header className="pb-2">
        { t('settings:system.header') }
      </Header>
      <Card className="w-full">
        <Card.Content className="flex flex-cols gap-3">
          <div className="w-full grid grid-cols-2">
            <div className="col-span-1 flex flex-col">
              <Label>
                { t('settings:system.language') }
              </Label>
              <Description>
                { t('settings:system.chooseLang') }
              </Description>
            </div>
            <div className="col-span-1 flex items-center">
              <Select
                aria-label={ t('settings:system.language') }
                placeholder={ t('settings:system.chooseLang') }
                fullWidth
                variant="secondary"
                value={ language }
                onChange={ (value) => changeLanguage(value) }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {
                      AVAILABLE_LANGUAGES.map(({ id, label }) => (
                        <ListBox.Item key={ id } id={ id } textValue={ label }>
                          { label }
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))
                    }
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="w-full grid grid-cols-2">
            <div className="col-span-1 flex flex-col">
              <Label>
                { t('settings:system.theme') }
              </Label>
              <Description>
                { t('settings:system.chooseTheme') }
              </Description>
            </div>
            <div className="col-span-1 flex items-center gap-1">
              <Tooltip>
                <Tooltip.Trigger>
                  <ToggleButton
                    size="sm"
                    isSelected={ theme === 'dark' }
                    onPress={ () => setTheme('dark') }
                  >
                    <Icon filled name="dark-mode" />
                    { t('settings:system.darkMode') }
                  </ToggleButton>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  { t('settings:system.switchDark') }
                </Tooltip.Content>
              </Tooltip>
              <Tooltip>
                <Tooltip.Trigger>
                  <ToggleButton
                    size="sm"
                    isSelected={ theme === 'light' }
                    onPress={ () => setTheme('light') }
                  >
                    <Icon filled name="light-mode" />
                    { t('settings:system.lightMode') }
                  </ToggleButton>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  { t('settings:system.switchLight') }
                </Tooltip.Content>
              </Tooltip>
            </div>
          </div>
        </Card.Content>
      </Card>
    </>
  );
};

export default SystemSettings;
