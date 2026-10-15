import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Description,
  Dropdown,
  Label,
  Separator,
  Skeleton
} from '@heroui/react';

import { isNotNil, not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { PROFILES } from '@/settings/keys.settings';

import CircleAvatar from '../../profile/CircleAvatar.ui';

function AvatarAccount() {
  const { t } = useTranslation();
  const { loading, user, signOut, profile } = useAuth();

  const navigate = useNavigate();

  if (loading) {
    return <Skeleton className="h-10 w-10 shrink-0" />;
  }

  if (isNotNil(user) && isNotNil(profile)) {
    const { email } = user;
    const { name, avatar_url, roles } = profile;
    const becomeOwnerOption = not(roles.includes(PROFILES.ROLES.OWNER));

    return (
      <Dropdown>
        <Dropdown.Trigger>
          <CircleAvatar size="xs" user={ { avatar_url, name } } />
        </Dropdown.Trigger>
        <Dropdown.Popover className="max-w-37.5">
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <CircleAvatar size="sm" user={ profile } />
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
              <Dropdown.Item id="dashboard" textValue={ t('common:account.dashboard') }>
                <Label>{ t('common:account.dashboard') }</Label>
              </Dropdown.Item>
              <Dropdown.Item id="profile" textValue={ t('common:account.profile') }>
                <Label>{ t('common:account.profile') }</Label>
              </Dropdown.Item>
              <Dropdown.Item id="settings" textValue={ t('common:account.settings') }>
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>{ t('common:account.settings') }</Label>

                </div>
              </Dropdown.Item>
              <Dropdown.Item id="new-project" textValue={ t('common:account.createTeam') }>
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>{ t('common:account.createTeam') }</Label>

                </div>
              </Dropdown.Item>
            </Dropdown.Section>
            { becomeOwnerOption &&
              <>
                <Separator />
                <Dropdown.Section>
                  <Dropdown.Item id="new-file" textValue={ t('common:actions.becomeOwner') }>
                    <div className="flex flex-col">
                      <Label>
                        { t('common:actions.becomeOwner') }
                      </Label>
                      <Description>
                        { t('common:texts.becomeOwner') }
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
                textValue={ t('common:actions.logOut') }
                variant="danger"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <Label>
                    { t('common:actions.logOut') }
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
        onPress={ () => navigate('/auth') }
      >
        { t('common:actions.login') }
      </Button>
    );
  }
};

export default AvatarAccount;
