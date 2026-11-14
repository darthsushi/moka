import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCreatePlacement, useEditPlacement } from '@/hooks/placements';
import { useAuth } from '@/hooks/contexts';
import { placementsService } from '@/services/placements.service';
import { getPlacementDetailsPath } from '@/helpers/utilities.helpers';

import { Header, HeaderTitle } from '@/components/ui';
import { PlacementManagerForm } from '@/components/forms';

function PlacementManager() {
  const { t } = useTranslation();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { create, isLoading: isCreatingPlacement } = useCreatePlacement();
  const { edit, isLoading: isEditingPlacement } = useEditPlacement();
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState({ key: null, placement: null, error: null });

  const [mode, query = ''] = hash.slice(1).split('?');
  const placementId = new URLSearchParams(query).get('id');
  const isEditMode = mode === 'edit' && Boolean(placementId);
  const requestKey = `${placementId}|${user?.id}|${authLoading}`;

  useEffect(() => {
    if (!isEditMode || authLoading) return;
    let active = true;
    placementsService.getPlacementForEdit(placementId, user?.id)
      .then(placement => { if (active) setLoaded({ key: requestKey, placement, error: null }); })
      .catch(fetchError => { if (active) setLoaded({ key: requestKey, placement: null, error: fetchError }); });
    return () => { active = false; };
  }, [isEditMode, placementId, user?.id, authLoading, requestKey]);

  const handleSubmitPlacement = async values => {
    setError(null);
    try {
      const result = isEditMode ? await edit(values, loaded.placement) : await create(values);
      navigate(getPlacementDetailsPath(result));
    } catch (saveError) {
      setError(saveError);
    }
  };
  
  return (
    <>
      <Header>
        <HeaderTitle title={ isEditMode ? t('common:pages.placement-manager-edit') : t('common:pages.placement-manager-new') } />
      </Header>
      <div className="mx-auto w-full max-w-300 p-4 sm:p-6 lg:p-8">
        { error && <p role="alert" className="mb-4 text-danger">{ t('placements:details.error') }: { error.message }</p> }
        { isEditMode && (authLoading || loaded.key !== requestKey)
          ? <p role="status">{ t('common:loading.loading') }</p>
          : isEditMode && (loaded.error || !loaded.placement)
            ? <p role="alert">{ t('placements:details.error') }</p>
            : <PlacementManagerForm
                key={ isEditMode ? placementId : 'new' }
                isEditing={ isEditMode }
                placement={ isEditMode ? loaded.placement : {} }
                onSubmitPlacement={ handleSubmitPlacement }
                isSaving={ isCreatingPlacement || isEditingPlacement }
              /> }
      </div>
    </>
  );
};

export default PlacementManager;
