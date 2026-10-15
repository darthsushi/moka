import { useTranslation } from 'react-i18next';

function NotFound() {
  const { t } = useTranslation();
  return <section className="w-full min-h-[calc(100vh-80px)] p-4 flex flex-col items-center justify-center text-center">{ t('common:alerts.notFound') }</section>;
}

export default NotFound;
