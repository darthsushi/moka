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

import { useLanguage, useUI } from '@/hooks/contexts';
import { AVAILABLE_LANGUAGES } from '@/settings/langs.settings';

import { Icon } from '@/components/ui';

import { SETTINGS_LANGS } from '../langs';
import { Label } from '@heroui/react';

function SystemSettings() {
  const { language, setLanguage } = useLanguage();
  const { setTheme, theme } = useUI();
  
  const SETTINGS_LANG = SETTINGS_LANGS[language];

  return (
    <>
      <Header className="pb-2">
        { SETTINGS_LANG.SYSTEM.HEADER }
      </Header>
      <Card className="w-full rounded-4xl">
        <Card.Content className="flex flex-cols gap-3">
          <div className="w-full grid grid-cols-2">
            <div className="col-span-1 flex flex-col">
              <Label>
                { SETTINGS_LANG.SYSTEM.LANGUAGE }
              </Label>
              <Description>
                { SETTINGS_LANG.SYSTEM.CHOOSE_LANG }
              </Description>
            </div>
            <div className="col-span-1 flex items-center">
              <Select
                placeholder={ SETTINGS_LANG.SYSTEM.CHOOSE_LANG }
                fullWidth
                variant="secondary"
                value={ language }
                onChange={ (value) => setLanguage(value) }
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
                { SETTINGS_LANG.SYSTEM.THEME }
              </Label>
              <Description>
                { SETTINGS_LANG.SYSTEM.CHOOSE_THEME }
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
                    { SETTINGS_LANG.SYSTEM.DARK_MODE }
                  </ToggleButton>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  { SETTINGS_LANG.SYSTEM.SWITCH_DARK }
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
                    { SETTINGS_LANG.SYSTEM.LIGHT_MODE }
                  </ToggleButton>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  { SETTINGS_LANG.SYSTEM.SWITCH_LIGHT }
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