import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { toast, Button, Fieldset, Form, Typography } from '@heroui/react';

import { useAuth } from '@/hooks/contexts';
import { APP_NAME } from '@/settings/keys.settings';

import { TextField } from '@/components/ui';

function SignInForm() {
  const { t } = useTranslation();
  const { handleSubmit, control } = useForm();
  const { loading, signIn } = useAuth()

  const onSubmit = async ({ email, password }) => {
    const { data, error } = await signIn(email, password);

    if (data?.user) {
      toast.success(t('auth:welcome'));
      return;
    }

    toast.danger(translateError(t, error));
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">
        { t('auth:welcomeBack') }
      </Typography>
      <Typography type="body-xs" color="muted">
        { t('auth:accountHint', { app: APP_NAME }) }
      </Typography>
      <Form
        onSubmit={ handleSubmit(onSubmit) }
        className="w-full pt-3"
        id="signin-form"
        aria-label={ t('auth:signIn') }
      >
        <Fieldset>
           <div
            data-form-content
            aria-label={ t('common:a11y.formContent') }
            className="w-full px-2 grid grid-cols-4"
          >
            <div
              data-signin-group
              className="col-span-4 py-2 flex flex-col gap-2"
            >
              <TextField
                name="email"
                label={ t('auth:email') }
                type="email"
                control={ control }
                placeholder={ t('auth:emailPlaceholder') }
                isDisabled={ loading }
              />
            </div>
            <div
              data-signin-group
              className="col-span-4 py-2 flex flex-col gap-2"
            >
              <TextField
                name="password"
                label={ t('auth:password') }
                type="password"
                control={ control }
                placeholder={ t('auth:password') }
                isDisabled={ loading }
              />
            </div>
          </div>
          <Fieldset.Actions className="w-full p-2">
            <Button
              fullWidth
              form="signin-form"
              type="submit"
              size="lg"
              isPending={ loading }
            >
              { t('auth:signIn') }
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </Form>
    </div>
  )
}

export default SignInForm;
