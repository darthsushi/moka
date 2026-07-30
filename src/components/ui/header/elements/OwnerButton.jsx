import { useState } from 'react';
import { Button, Skeleton, toast } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useCreatePlacement } from '@/hooks/useCreatePlacement';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';
import { PROFILES } from '@/settings/keys.settings';

import { Placement } from '@/components/forms';
import Dialog from '../../dialog/Dialog.ui';

function OwnerButton() {
  const [isModalOpen, setIsModalOpen] = useState(() => false);

  const { language } = useLanguage();
  const { profile, loading: isAuthLoading } = useAuth();
  const {  create: createPlacement, isLoading: isCreatingPlacement  } = useCreatePlacement();

  const BUTTONS_LABELS = SYSTEM_LANG[language].BUTTONS;
  const ERRORS_LABELS = SYSTEM_LANG[language].ERRORS;
  const TEXTS_LABELS = SYSTEM_LANG[language].TEXTS;

  if (isAuthLoading) {
    return <Skeleton className="h-5 w-30 rounded-lg" />;
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
            { BUTTONS_LABELS.NEW_PLACEMENT }
          </Button>
          <Dialog
            isModalOpen={ isModalOpen }
            setIsModalOpen={ setIsModalOpen }
            title={ BUTTONS_LABELS.NEW_PLACEMENT }
            iconName="magnify-full-screen"
            isLoading={ isCreatingPlacement }
          > 
            <Placement
              placement={ {} }
              isEditing={ false }
              isPending={ isCreatingPlacement }
              onSubmit={async (placement) => {
                try {
                  const placementCreated = await createPlacement(placement);
                  console.log(placementCreated);

                  setIsModalOpen(false);
                  toast.success(TEXTS_LABELS.ADD_SUCCESS_MESSAGE);
                } catch ({ label: errorLabel })  {
                  toast.danger(ERRORS_LABELS[errorLabel] || ERRORS_LABELS.UNEXPECTED_ERROR);
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
        { BUTTONS_LABELS.BECOME_OWNER }
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="ghost"
    >
      { BUTTONS_LABELS.BECOME_OWNER }
    </Button>
  );
}

export default OwnerButton;
