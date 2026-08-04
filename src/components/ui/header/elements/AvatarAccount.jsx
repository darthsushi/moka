import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Description,
  Dropdown,
  Label,
  Separator,
  Skeleton
} from '@heroui/react';

import { isNotNil, not } from '@/helpers/ramda.helpers';
import { useAuth, useLanguage } from '@/hooks/contexts';
import { PROFILES } from '@/settings/keys.settings';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';

function AvatarAccount() {
  const { loading, user, signOut, profile } = useAuth();
  const { language } = useLanguage();
  
  const navigate = useNavigate();

  const BUTTONS_LANG = SYSTEM_LANG[language].BUTTONS;
  const TEXTS_LANG = SYSTEM_LANG[language].TEXTS;

  if (loading) {
    return <Skeleton className="h-10 w-10 shrink-0 rounded-full" />;
  }

  if (isNotNil(user) && isNotNil(profile)) {
    const { email } = user;
    const { name, avatar_url, roles } = profile;
    const avatar = isNotNil(avatar_url) ? avatar_url : 'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg';
    const becomeOwnerOption = not(roles.includes(PROFILES.ROLES.OWNER));

    return (
      <Dropdown>
        <Dropdown.Trigger className="rounded-full">
          <Avatar>
            <Avatar.Image
              alt={ name }
              src={ avatar }
            />
            <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
          </Avatar>
        </Dropdown.Trigger>
        <Dropdown.Popover className="max-w-37.5">
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <Avatar.Image
                  alt={ name }
                  src={ avatar }
                />
                <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col gap-0">
                <p className="text-sm leading-4 font-medium">
                  { name }
                </p>
                <p className="text-xs leading-none text-muted truncate">
                  { email }
                </p>
              </div>
            </div>
          </div>
          <Dropdown.Menu>
            <Dropdown.Section>
              <Dropdown.Item id="dashboard" textValue="Dashboard">
                <Label>Dashboard</Label>
              </Dropdown.Item>
              <Dropdown.Item id="profile" textValue="Profile">
                <Label>Profile</Label>
              </Dropdown.Item>
              <Dropdown.Item id="settings" textValue="Settings">
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>Settings</Label>
                  
                </div>
              </Dropdown.Item>
              <Dropdown.Item id="new-project" textValue="New project">
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>Create Team</Label>
                  
                </div>
              </Dropdown.Item>
            </Dropdown.Section>
            { becomeOwnerOption &&
              <>
                <Separator />
                <Dropdown.Section>
                  <Dropdown.Item id="new-file" textValue="New file">
                    <div className="flex flex-col">
                      <Label>
                        { BUTTONS_LANG.BECOME_OWNER }
                      </Label>
                      <Description>
                        { TEXTS_LANG.BECOME_OWNER }
                      </Description>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Section>
              </>
            }
            <Separator />
            <Dropdown.Section>
              <Dropdown.Item
                onPress={ signOut }
                id="logout"
                textValue={ BUTTONS_LANG.LOG_OUT }
                variant="danger"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>
                    { BUTTONS_LANG.LOG_OUT }
                  </Label>
                </div>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  } else {
    return (
      <Button
        size="lg"
        variant="primary"
        onPress={ () => navigate('auth') }
      >
        { BUTTONS_LANG.LOGIN }
      </Button>
    );
  }
};

export default AvatarAccount;
