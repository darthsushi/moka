import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Description,
  Header,
  Label,
  ListBox,
  Separator,
  Skeleton,
  Typography
} from '@heroui/react';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';

import { EditUserProfile } from '@/components/forms';
import { CircleAvatar, Dialog, Icon } from '@/components/ui';

function Account() {
  const { t } = useTranslation();
  const { isAuthenticated, /* user, */ signOut, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <>
        <div className="w-full flex">
          <Skeleton className="w-25 h-25 flex-none" />
          <div className="w-full p-2 flex flex-col gap-1">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-5" />
          </div>
        </div>
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
      </>
    )
  }

  if (not(isAuthenticated)) {
    return (
      <div className="w-full">
        <Typography type="h6" className="mb-1.5">
          { t('settings:user.access') }
        </Typography>
        <Typography type="body-xs" color="muted" className="leading-3.5">
          { t('settings:user.accessDescription') }
        </Typography>
        <div className="w-full flex justify-between mt-5 items-end">
          <Button size="lg" variant="tertiary" onPress={ () => navigate('/auth') }>
            { t('common:actions.login') }
          </Button>
          <div className="billboard-asset asset-top-30 w-30 h-30" />
        </div>
      </div>
    );
  }

  const { name, avatar_url, roles } = profile;
  // console.log(profile, user)
  const isOwner = (roles || []).includes('owner');

  return (
    <>
      <section className="w-full flex pb-4">
        <CircleAvatar size="md" user={ { name, avatar_url } } />
        <div className="w-full h-fit p-1 flex flex-wrap gap-1">
          <Typography type="h5" className="w-full flex-none leading-4.5 my-2">
            { name }
          </Typography>
          <Button
            size="sm"
            variant="primary"
            onPress={ () => setIsEditing(true) }
          >
            { t('common:tooltips.edit') }
          </Button>
          <Button onPress={ signOut } size="sm" variant="danger-soft">
            { t('common:actions.logOut') }
          </Button>
        </div>
      </section>
      <Separator variant="secondary" />
      <ListBox
        aria-label={ t('settings:profile.actions') }
        className="w-full"
        selectionMode="none"
        onAction={(key) => alert(t('settings:profile.selectedAction', { action: key }))}
      >
        {
          isOwner ?
            <ListBox.Section>
              <Header>
                { t('settings:owner.header') }
              </Header>
              <ListBox.Item
                id="payment_methods"
                textValue={ t('settings:owner.paymentsMethods') }
              >
                <div className="flex h-8 items-center text-lg justify-center pt-px">
                  <Icon filled name="payments" />
                </div>
                <div className="flex flex-col">
                  <Label>{ t('settings:owner.paymentsMethods') }</Label>
                </div>
              </ListBox.Item>
            </ListBox.Section>
          :
            <ListBox.Section>
              <ListBox.Item
                id="become_owner"
                textValue={ t('settings:owner.paymentsMethods') }
              >
                <div className="flex h-8 items-start justify-center pt-px">
                  <Icon filled name="bar-chart" />
                </div>
                <div className="flex flex-col">
                  <Label>
                    { t('settings:advertiser.becomeOwner') }
                  </Label>
                  <Description>
                   { t('settings:advertiser.becomeOwnerDescription') }
                  </Description>
                </div>
              </ListBox.Item>
            </ListBox.Section>
        }
        <ListBox.Section>
          <Header>
            { t('settings:privacity.header') }
          </Header>
           <ListBox.Item
              id="update_password"
              textValue={ t('settings:privacity.changePassword') }
            >
              <div className="flex h-8 items-center text-lg justify-center pt-px">
                <Icon filled name="shield-lock" />
              </div>
              <div className="flex flex-col">
                <Label>
                  { t('settings:privacity.changePassword') }
                </Label>
              </div>
            </ListBox.Item>
        </ListBox.Section>
      </ListBox>
      <Dialog
        isModalOpen={ isEditing }
        setIsModalOpen={ setIsEditing }
        title={ t('settings:profile.edit') }
        dismissOptions={
          {
            enabled: false,
            disableKeyboard: true,
          }
        }
        size="sm"
      >
        <EditUserProfile
          closeModal={ () => setIsEditing(false) }
          user={ { name, avatar_url } }
        />
      </Dialog>
    </>
  );
};

export default Account;
