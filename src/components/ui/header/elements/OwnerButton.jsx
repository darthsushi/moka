import { translateError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button, Skeleton, toast } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { useCreatePlacement } from '@/hooks/placements';
import { PROFILES } from '@/settings/keys.settings';

import { PlacementForm } from '@/components/forms';
import Dialog from '../../dialog/Dialog.ui';

function OwnerButton() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(() => false);

  const { profile, loading: isAuthLoading } = useAuth();
  const { create: createPlacement, isLoading: isCreatingPlacement } = useCreatePlacement();

  if (isAuthLoading) {
    return <Skeleton className="h-5 w-30" />;
  }

  if (isNotNil(profile)) {
    const { roles } = profile;
    const isOwner = roles.includes(PROFILES.ROLES.OWNER);

    if (isOwner) {
      return (
        <>
          <Button
            onPress={ () => setIsModalOpen(true) }
            size="lg"
            variant="primary"
          >
            { t('common:actions.newPlacement') }
          </Button>
          <Dialog
            isModalOpen={ isModalOpen }
            setIsModalOpen={ setIsModalOpen }
            title={ t('common:actions.newPlacement') }
            icon = { { name: "magnify-full-screen" } }
            isLoading={ isCreatingPlacement }
          >
            <PlacementForm
              placement={ {} }
              isEditing={ false }
              isPending={ isCreatingPlacement }
              onSubmit={async (placement) => {
                try {
                  const placementCreated = await createPlacement(placement);
                  console.log(placementCreated);

                  setIsModalOpen(false);
                  toast.success(t('common:texts.addSuccessMessage'));
                } catch (error)  {
                  toast.danger(translateError(t, error));
                }
              }}
            />
          </Dialog>
        </>
      )
    }

    return (
      <Button
        size="lg"
        variant="primary"
      >
        { t('common:actions.becomeOwner') }
      </Button>
    );
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
