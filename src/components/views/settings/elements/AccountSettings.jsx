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
import { useAuth, useLanguage } from '@/hooks/contexts';

import { EditUserProfile } from '@/components/forms';
import { CircleAvatar, Dialog, Icon } from '@/components/ui';

import { SETTINGS_LANGS } from '../langs';

function Account() {
  const { isAuthenticated, /* user, */ signOut, loading, profile } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const SETTINGS_LANG = SETTINGS_LANGS[language];

  if (loading) {
    return (
      <>
        <div className="w-full flex">
          <Skeleton className="w-25 h-25 flex-none rounded-4xl" />
          <div className="w-full p-2 flex flex-col gap-1">
            <Skeleton className="w-full h-10 rounded-3xl" />
            <Skeleton className="w-full h-5 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="w-full h-12 rounded-3xl" />
        <Skeleton className="w-full h-12 rounded-3xl" />
      </>
    )
  }

  if (not(isAuthenticated)) {
    return (
      <div className="w-full">
        <Typography type="h6" className="mb-1.5">
          { SETTINGS_LANG.USER.ACCESS }
        </Typography>
        <Typography type="body-xs" color="muted" className="leading-3.5">
          { SETTINGS_LANG.USER.ACCESS_DESCRIPTION }
        </Typography>
        <div className="w-full flex justify-between mt-5 items-end">
          <Button size="lg" variant="tertiary" onPress={ () => navigate('/auth') }>
            { SETTINGS_LANG.USER.LOG_IN }
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
            { SETTINGS_LANG.USER.EDIT }
          </Button>
          <Button onPress={ signOut } size="sm" variant="danger-soft">
            { SETTINGS_LANG.USER.LOG_OUT }
          </Button>
        </div>
      </section>
      <Separator variant="secondary" />
      <ListBox
        aria-label="File actions"
        className="w-full"
        selectionMode="none"
        onAction={(key) => alert(`Selected item: ${key}`)}
      >
        { 
          isOwner ?
            <ListBox.Section>
              <Header>
                { SETTINGS_LANG.OWNER.HEADER }
              </Header>
              <ListBox.Item
                  className="rounded-3xl"
                id="payment_methods"
                textValue={ SETTINGS_LANG.OWNER.PAYMENTS_METHODS }
              >
                <div className="flex h-8 items-center text-lg justify-center pt-px">
                  <Icon filled name="payments" />
                </div>
                <div className="flex flex-col">
                  <Label>{ SETTINGS_LANG.OWNER.PAYMENTS_METHODS }</Label>
                </div>
              </ListBox.Item>
            </ListBox.Section>
          :
            <ListBox.Section>
              <ListBox.Item
                  className="rounded-3xl"
                id="become_owner"
                textValue={ SETTINGS_LANG.OWNER.PAYMENTS_METHODS }
              >
                <div className="flex h-8 items-start justify-center pt-px">
                  <Icon filled name="bar-chart" />
                </div>
                <div className="flex flex-col">
                  <Label>
                    { SETTINGS_LANG.ADVERTISER.BECOME_OWNER }
                  </Label>
                  <Description>
                   { SETTINGS_LANG.ADVERTISER.BECOME_OWNER_DESCRIPTION }
                  </Description>
                </div>
              </ListBox.Item>
            </ListBox.Section>
        }
        <ListBox.Section>
          <Header>
            { SETTINGS_LANG.PRIVACITY.HEADER }
          </Header>
           <ListBox.Item
              className="rounded-3xl"
              id="update_password"
              textValue={ SETTINGS_LANG.PRIVACITY.CHANGE_PASSWORD }
            >
              <div className="flex h-8 items-center text-lg justify-center pt-px">
                <Icon filled name="shield-lock" />
              </div>
              <div className="flex flex-col">
                <Label>
                  { SETTINGS_LANG.PRIVACITY.CHANGE_PASSWORD }
                </Label>
              </div>
            </ListBox.Item>
        </ListBox.Section>
      </ListBox>
      <Dialog
        isModalOpen={ isEditing }
        setIsModalOpen={ setIsEditing }
        title="Edit profile"
        isDismissable={ false }
        isKeyboardDismissDisabled={ true }
        showDefaultCloseButton={ false }
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
