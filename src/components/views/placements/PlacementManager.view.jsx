import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Header, HeaderTitle } from '@/components/ui';
import { PlacementManagerForm } from '@/components/forms';

function PlacementManager() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  const [mode, query = ''] = hash.slice(1).split('?');
  const placementId = new URLSearchParams(query).get('id');
  const isEditMode = mode === 'edit' && Boolean(placementId);
  
  return (
    <>
      <Header>
        <HeaderTitle title={ isEditMode ? t('common:pages.placement-manager-edit') : t('common:pages.placement-manager-new') } />
      </Header>
      <div className="mx-auto w-full max-w-300 p-4 sm:p-6 lg:p-8">
        <PlacementManagerForm isEditing={ isEditMode } />
      </div>
    </>
  );
};

export default PlacementManager;
