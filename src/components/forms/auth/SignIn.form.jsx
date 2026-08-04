import { useForm } from 'react-hook-form';
import { toast, Button, Fieldset, Form, Typography } from '@heroui/react';


import { useAuth } from '@/hooks/contexts';
import { APP_NAME } from '@/settings/keys.settings';

import { TextField } from '@/components/ui';

function SignInForm() {
  const { handleSubmit, control } = useForm();
  const { loading, signIn } = useAuth()

  const onSubmit = async ({ email, password }) => {
    const { data, error } = await signIn(email, password);

    if (data.user) {
      toast.success('Welcome :)');
      return;
    }

    toast.danger(error?.message);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <Typography type="body">
        Welcome back!
      </Typography>
      <Typography type="body-xs" color="muted">
        { `Sign in to your ${APP_NAME} account` }
      </Typography>
      <Form
        onSubmit={ handleSubmit(onSubmit) }
        className="w-full pt-3"
        id="signin-form"
        aria-label="signin-form"
      >
        <Fieldset>
           <div
            data-form-content
            aria-label="form-content"
            className="w-full px-2 grid grid-cols-4"
          >
            <div
              data-signin-group
              className="col-span-4 py-2 flex flex-col gap-2"
            >
              <TextField
                name="email"
                label="Email"
                type="email"
                control={ control }
                placeholder="Email address"
                isDisabled={ loading }
              />
            </div>
            <div
              data-signin-group
              className="col-span-4 py-2 flex flex-col gap-2"
            >
              <TextField
                name="password"
                label="Password"
                type="password"
                control={ control }
                placeholder="Password"
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
              Sign in
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </Form>
    </div>
  )
}

export default SignInForm;
