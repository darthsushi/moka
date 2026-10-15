import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, Form, Spinner, Tabs } from '@heroui/react';

import { noop, not } from '@/helpers/ramda.helpers';
import { useProfileSettings } from '@/hooks/profile';

import { AvatarField, FlatCard, TextField } from '@/components/ui';

function EditUserProfile({ closeModal = noop, user = {} }) {
  const { t } = useTranslation();
  const { handleSubmit, control } = useForm();
  const { updateAvatar, updateName } = useProfileSettings();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const onNameFormSubmit = async ({ name }) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      await updateName(name);
      closeModal();
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAvatarFormSubmit = async ({ avatar_url }) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      await updateAvatar(avatar_url);
      closeModal();
    } catch (error) {
      setSubmitError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs className="w-full max-w-md" isDisabled={ isLoading }>
      <Tabs.ListContainer>
        <Tabs.List aria-label={ t('settings:profile.edit') }>
          <Tabs.Tab id="name">
            { t('settings:profile.name') }
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="avatar">
            <Tabs.Separator />
            { t('settings:profile.avatar') }
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="name">
        <Form
          className="w-full pt-3"
          id="edit-name-profile-form"
          aria-label={ t('settings:profile.name') }
          onSubmit={ handleSubmit(onNameFormSubmit) }
        >
          { submitError && <p role="alert" className="text-sm text-danger">{ translateError(t, submitError) }</p> }
          <Fieldset>
            <Fieldset.Group>
              <FlatCard
                  variant="secondary"
                  className="col-span-1"
                >
                  <TextField
                    control={ control }
                    name="name"
                    isRequired
                    defaultValue={ user.name }
                    maxLength={ 200 }
                    minLength={ 5 }
                    label={ t('settings:profile.name') }
                    onChange={ () => setIsEditingName(true) }
                    placeholder={ t('settings:profile.namePlaceholder') }
                    errors={
                      {
                        required: t('validation:required'),
                        minLength: t('validation:minLength', { min: 5 })
                      }
                    }
                  />
              </FlatCard>
            </Fieldset.Group>
            <Fieldset.Actions className="flex gap-1">
              <Button
                size="lg"
                variant="ghost"
                onPress={ closeModal }
                isDisabled={ isLoading }
              >
                { t('common:actions.cancel') }
              </Button>
              <Button
                fullWidth
                size="lg"
                type="submit"
                isDisabled={ not(isEditingName) || isLoading }
              >
                { isLoading && <Spinner size="sm" color="current" /> }
                { t('common:actions.save') }
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </Form>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="avatar">
        <Form
          className="w-full pt-3"
          id="edit-avatar-profile-form"
          aria-label={ t('settings:profile.avatar') }
          onSubmit={ handleSubmit(onAvatarFormSubmit) }
        >
          { submitError && <p role="alert" className="text-sm text-danger">{ translateError(t, submitError) }</p> }
          <Fieldset>
            <Fieldset.Group>
              <FlatCard
                variant="secondary"
                className="col-span-1 p-3"
              >
                <AvatarField
                  user={ user }
                  control={ control }
                  onChange={ () => setIsEditingAvatar(true) }
                  name="avatar_url"
                />
              </FlatCard>
            </Fieldset.Group>
            <Fieldset.Actions className="flex gap-1">
              <Button
                size="lg"
                variant="ghost"
                onPress={ closeModal }
                isDisabled={ isLoading }
              >
                { t('common:actions.cancel') }
              </Button>
              <Button
                fullWidth
                size="lg"
                type="submit"
                isDisabled={ not(isEditingAvatar) || isLoading }
              >
                { isLoading && <Spinner size="sm" color="current" /> }
                { t('common:actions.save') }
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </Form>
      </Tabs.Panel>
    </Tabs>
  )
};

export default EditUserProfile;
