import { useLocation } from 'react-router-dom';
import { Typography } from '@heroui/react';
import { Card } from '@heroui/react';

import { APP_NAME } from '@/settings/keys.settings';

import { Logo } from '@/components/ui';
import { SignInForm, SignUpForm } from '@/components/forms';

function Auth() {
  const { hash } = useLocation();

  const isSignUp = hash.includes('#signup');

  // TODO: Add terms and privacity.
  return (
    <div className="w-full min-h-dvh flex flex-col justify-between items-center overflow-y-auto">
      <header className="w-full flex justify-center sticky top-0">
        <Logo small />
      </header>
      <Card variant="transparent" className="w-full min-w-80 max-w-100">
        { 
          isSignUp ?
            <SignUpForm />
          :
            <SignInForm />
        }
      </Card>
      <footer className="w-full p-2 flex justify-center sticky bottom-0">
        <Typography type="body-xs">
          { `By continuing, you agree to ${APP_NAME}'s Terms and Privacy` }
        </Typography>
      </footer>
    </div>
  );
}

export default Auth;
