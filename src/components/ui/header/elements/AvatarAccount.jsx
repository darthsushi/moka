import { useState } from 'react';
import {
  Avatar,
  Button,
  Description,
  Dropdown,
  FieldError,
  Form,
  Input,
  Label,
  Separator,
  Skeleton,
  Spinner,
  TextField,
  toast
} from '@heroui/react';

import { isNotNil, not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { PROFILES } from '@/settings/keys.settings';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';

import Dialog from '../../dialog/Dialog.ui';

function AvatarAccount() {
  const { signIn, loading, user, signOut, profile } = useAuth();
  const { language } = useLanguage();

  const [load, setIsLoad] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const BUTTONS_LANG = SYSTEM_LANG[language].BUTTONS;
  const TEXTS_LANG = SYSTEM_LANG[language].TEXTS;

  const handleOpenModal = () => {
    console.log("Haciendo validaciones antes de abrir...");
    setIsModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoad(true);
    const formData = new FormData(e.currentTarget);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    
    const { email, password } = data;
    const { data: { user }, error } = await signIn(email, password);
    
    setIsLoad(false);
    if (isNotNil(user)) {
      setIsModalOpen(false);
      toast.success('Bienvenido!');
    } else {
      toast.danger(error.message);
    }
  };

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
                <p className="text-xs leading-none text-muted">
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
      <>
        <Button size="lg" variant="primary" onPress={ handleOpenModal }>
          { BUTTONS_LANG.LOGIN }
        </Button>
        <Dialog
          isModalOpen={ isModalOpen }
          setIsModalOpen={ setIsModalOpen }
          isDismissable={ false }
          isKeyboardDismissDisabled={ true }
          title="Iniciar Sesion"
        >
          <Form className="flex w-full flex-col gap-4" onSubmit={ onSubmit }>
            <TextField
              isRequired
              name="email"
              type="email"
              validate={(value) => {
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return "Correo invalido";
                }
                return null;
              }}
            >
              <Label>Correo:</Label>
              <Input placeholder="user@example.com" />
              <FieldError />
            </TextField>
            <TextField
              isRequired
              minLength={8}
              name="password"
              type="password"
              validate={(value) => {
                if (value.length < 8) {
                  return "La contraseña debe tener al menos 8 caracteres.";
                }
                if (!/[0-9]/.test(value)) {
                  return "La contraseña debe contener al menos un número.";
                }
                return null;
              }}
            >
              <Label>Contraseña</Label>
              <Input placeholder="Introduce tu contraseña" />
              <Description>Debe tener al menos 8 caracteres, incluyendo 1 número.</Description>
              <FieldError />
            </TextField>
            <div className="flex gap-2">
              <Button type="submit" isPending={ load } >
                {({isPending}) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    Acceder
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Dialog>
      </>
    );
  }
};

export default AvatarAccount;
