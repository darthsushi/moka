import { useTranslation } from 'react-i18next';
function AccessDenied() {
  const { t } = useTranslation();
  return(
    <>
      { t('common:alerts.forbidden') }
    </>
  )
};

export default AccessDenied;
