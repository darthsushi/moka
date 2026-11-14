import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, Form, Typography, toast } from '@heroui/react';

import { TextField } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import { translateError } from '@/i18n/errors';

function SignUpForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { handleSubmit, control, getValues } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ name, email, password }) => {
    setSubmitting(true);
    try {
      const { data, error } = await signUp(email.trim(), password, name.trim());
      if (error) throw error;
      if (data?.session) toast.success(t('auth:welcome'));
      else setSent(true);
    } catch (error) {
      toast.danger(translateError(t, error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">{ t('auth:createAccount') }</Typography>
      { sent ? <Typography type="body-sm" color="muted">{ t('auth:checkConfirmationEmail') }</Typography> : <>
        <Typography type="body-xs" color="muted">{ t('auth:signUpHint') }</Typography>
        <Form onSubmit={ handleSubmit(onSubmit) } className="w-full pt-3" id="signup-form" aria-label={ t('auth:signUp') }>
          <Fieldset>
            <div className="w-full px-2 flex flex-col gap-4">
              <TextField name="name" label={ t('auth:name') } control={ control }
                placeholder={ t('auth:namePlaceholder') } isRequired minLength={ 5 } maxLength={ 120 }
                validate={ value => value.trim().length >= 5 || 'minLength' } isDisabled={ submitting } />
              <TextField name="email" label={ t('auth:email') } type="email" control={ control }
                placeholder={ t('auth:emailPlaceholder') } isRequired isDisabled={ submitting } />
              <TextField name="password" label={ t('auth:password') } type="password" control={ control }
                isRequired minLength={ 8 } isDisabled={ submitting } />
              <TextField name="confirmPassword" label={ t('auth:confirmPassword') } type="password" control={ control }
                isRequired isDisabled={ submitting }
                validate={ value => value === getValues('password') || 'passwordMismatch' } />
            </div>
            <Fieldset.Actions className="w-full p-2">
              <Button fullWidth form="signup-form" type="submit" size="lg" isPending={ submitting }>
                { t('auth:signUp') }
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </Form>
      </> }
      <Button size="sm" variant="ghost" onPress={ () => navigate('/auth') }>
        { t('auth:backToSignIn') }
      </Button>
    </div>
  );
}

export default SignUpForm;
