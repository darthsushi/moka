import { useTranslation } from 'react-i18next';
import { Button, Skeleton } from '@heroui/react';

import { useAuth } from '@/hooks/contexts';


function OwnerButton() {
  const { t } = useTranslation();

  const { loading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <Skeleton className="h-5 w-30" />;
  }

  return (
    <Button
      size="lg"
      variant="ghost"
    >
      { t('common:actions.becomeOwner') }
    </Button>
  );
}

export default OwnerButton;
