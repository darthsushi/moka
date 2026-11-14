import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCreatePlacement } from '@/hooks/placements';
import { getPlacementDetailsPath } from '@/helpers/utilities.helpers';

import { Header, HeaderTitle } from '@/components/ui';
import { PlacementManagerForm } from '@/components/forms';

function PlacementManager() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { create, isLoading: isCreatingPlacement } = useCreatePlacement();
  const [error, setError] = useState(null);

  const [mode, query = ''] = hash.slice(1).split('?');
  const placementId = new URLSearchParams(query).get('id');
  const isEditMode = mode === 'edit' && Boolean(placementId);
  const handleCreate = async values => {
    setError(null);
    try {
      const created = await create(values);
      navigate(getPlacementDetailsPath(created));
    } catch (creationError) {
      setError(creationError);
    }
  };
  
  return (
    <>
      <Header>
        <HeaderTitle title={ isEditMode ? t('common:pages.placement-manager-edit') : t('common:pages.placement-manager-new') } />
      </Header>
      <div className="mx-auto w-full max-w-300 p-4 sm:p-6 lg:p-8">
        { error && <p role="alert" className="mb-4 text-danger">{ t('placements:details.error') }: { error.message }</p> }
        <PlacementManagerForm isEditing={ isEditMode } onCreate={ handleCreate } isCreatingPlacement={ isCreatingPlacement } />
      </div>
    </>
  );
};

export default PlacementManager;
