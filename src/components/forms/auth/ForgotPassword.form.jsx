import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, Form, Typography, toast } from '@heroui/react';

import { TextField } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import { translateError } from '@/i18n/errors';

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { handleSubmit, control } = useForm({ defaultValues: { email: '' } });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (error) {
      toast.danger(translateError(t, error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">{ t('auth:forgotPassword') }</Typography>
      <Typography type="body-xs" color="muted">
        { sent ? t('auth:recoveryEmailSent') : t('auth:recoveryHint') }
      </Typography>
      { !sent && <Form onSubmit={ handleSubmit(onSubmit) } className="w-full pt-3" id="recovery-form" aria-label={ t('auth:forgotPassword') }>
        <Fieldset>
          <div className="w-full px-2">
            <TextField name="email" label={ t('auth:email') } type="email" control={ control }
              placeholder={ t('auth:emailPlaceholder') } isRequired isDisabled={ submitting } />
          </div>
          <Fieldset.Actions className="w-full p-2">
            <Button fullWidth form="recovery-form" type="submit" size="lg" isPending={ submitting }>
              { t('auth:sendRecoveryEmail') }
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </Form> }
      <Button size="sm" variant="ghost" onPress={ () => navigate('/auth') }>
        { t('auth:backToSignIn') }
      </Button>
    </div>
  );
}

export default ForgotPasswordForm;
