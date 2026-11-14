import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, Form, Typography, toast } from '@heroui/react';

import { TextField } from '@/components/ui';
import { useAuth } from '@/hooks/contexts';
import { authService } from '@/services/auth.service';
import { translateError } from '@/i18n/errors';

function ResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { handleSubmit, control, getValues } = useForm({
    defaultValues: { password: '', confirmPassword: '' }
  });
  const [status, setStatus] = useState('checking');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: listener } = authService.onAuthStateChange((_event, session) => {
      if (active) setStatus(previous => previous === 'success' ? previous
        : authService.isRecoverySession(session) ? 'ready' : 'invalid');
    });
    authService.getSession().then(({ data }) => {
      if (active) setStatus(previous => previous === 'success' ? previous
        : authService.isRecoverySession(data?.session) ? 'ready' : 'invalid');
    }).catch(() => { if (active) setStatus('invalid'); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setStatus('success');
      toast.success(t('auth:passwordUpdated'));
    } catch (error) {
      toast.danger(translateError(t, error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">{ t('auth:newPassword') }</Typography>
      { status === 'checking' && <Typography type="body-xs" color="muted">{ t('common:loading.loading') }</Typography> }
      { status === 'invalid' && <>
        <Typography type="body-xs" color="muted">{ t('auth:invalidRecoveryLink') }</Typography>
        <Button size="lg" onPress={ () => navigate('/auth#forgot-password') }>{ t('auth:requestNewLink') }</Button>
      </> }
      { status === 'success' && <>
        <Typography type="body-xs" color="muted">{ t('auth:passwordUpdated') }</Typography>
        <Button size="lg" onPress={ () => navigate('/') }>{ t('auth:continue') }</Button>
      </> }
      { status === 'ready' && <Form onSubmit={ handleSubmit(onSubmit) } className="w-full pt-3" id="reset-password-form" aria-label={ t('auth:newPassword') }>
        <Fieldset>
          <div className="w-full px-2 flex flex-col gap-4">
            <TextField name="password" label={ t('auth:newPassword') } type="password" control={ control }
              isRequired minLength={ 8 } isDisabled={ submitting } />
            <TextField name="confirmPassword" label={ t('auth:confirmPassword') } type="password" control={ control }
              isRequired isDisabled={ submitting }
              validate={ value => value === getValues('password') || 'passwordMismatch' } />
          </div>
          <Fieldset.Actions className="w-full p-2">
            <Button fullWidth form="reset-password-form" type="submit" size="lg" isPending={ submitting }>
              { t('auth:updatePassword') }
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </Form> }
    </div>
  );
}

export default ResetPasswordForm;
