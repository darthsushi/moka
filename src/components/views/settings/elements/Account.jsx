import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '@heroui/react';

import { not } from '@/helpers/ramda.helpers';
import { useAuth, useLanguage } from '@/hooks/contexts';

import { SYSTEM } from '@/settings/langs.settings';

import { CircleAvatar } from '@/components/ui';

function Account() {
  const { isAuthenticated, user, loading, profile } = useAuth();
  const { language } = useLanguage();
   const navigate = useNavigate();

  const SYSTEM_LANG = SYSTEM[language];

  if (loading) {
    return (
      <>
        loading
      </>
    )
  }

  if (not(isAuthenticated)) {
    return (
      <div className="w-full">
        <Typography type="h6" className="mb-1.5">
          { SYSTEM_LANG.TEXTS.ACCESS_YOUR_ACCOUNT }
        </Typography>
        <Typography type="body-xs" color="muted" className="leading-3.5">
          { SYSTEM_LANG.TEXTS.LOG_TO_ACCESS_TOOLS }
        </Typography>
        <div className="w-full flex justify-between mt-5 items-end">
          <Button size="lg" variant="tertiary" onPress={ () => navigate('/auth') }>
            { SYSTEM_LANG.BUTTONS.LOGIN }
          </Button>
          <div className="billboard-asset asset-top-30 w-30 h-30" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CircleAvatar user={ { name: 'roko' } } />
    </div>
  );
};

export default Account;
