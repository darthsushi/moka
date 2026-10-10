import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, Form, Spinner, Tabs } from '@heroui/react';

import { noop, not } from '@/helpers/ramda.helpers';
import { useProfileSettings } from '@/hooks/profile';

import { AvatarField, FlatCard, TextField } from '@/components/ui';

function EditUserProfile({ closeModal = noop, user = {} }) {
  const { handleSubmit, control } = useForm();
  const { updateAvatar, updateName } = useProfileSettings();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Apply error messages.
  const onNameFormSubmit = async ({ name }) => {
    setIsLoading(true);

    try {
      await updateName(name);
      closeModal();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onAvatarFormSubmit = async ({ avatar_url }) => {
    setIsLoading(true);

    try {
      await updateAvatar(avatar_url);
      closeModal();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs className="w-full max-w-md" isDisabled={ isLoading }>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Options">
          <Tabs.Tab id="name">
            Nombre
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="avatar">
            <Tabs.Separator />
            Avatar
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="name">
        <Form
          className="w-full pt-3"
          id="edit-name-profile-form"
          aria-label="edit-name-profile-form"
          onSubmit={ handleSubmit(onNameFormSubmit) }
        >
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
                    label="Nombre"
                    onChange={ () => setIsEditingName(true) }
                    placeholder="El nombre no puede estar en blanco"
                    errors={
                      {
                        required: 'El nombre no puede quedar vacio',
                        minLength: 'Requiere mas de 5'
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
                Cancelar
              </Button>
              <Button
                fullWidth
                size="lg"
                type="submit"
                isDisabled={ not(isEditingName) || isLoading }
              >
                { isLoading && <Spinner size="sm" color="current" /> }
                Guardar
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </Form>
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="avatar">
        <Form
          className="w-full pt-3"
          id="edit-avatar-profile-form"
          aria-label="edit-avatar-profile-form"
          onSubmit={ handleSubmit(onAvatarFormSubmit) }
        >
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
                Cancelar
              </Button>
              <Button
                fullWidth
                size="lg"
                type="submit"
                isDisabled={ not(isEditingAvatar) || isLoading }
              >
                { isLoading && <Spinner size="sm" color="current" /> }
                Guardar
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </Form>
      </Tabs.Panel>
    </Tabs>
  )
};

export default EditUserProfile;
