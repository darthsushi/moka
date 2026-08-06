import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANG } from '@/settings/langs.settings';

function NotFound() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const PAGES_LANG = SYSTEM_LANG[language].PAGES;

  return (
    <section className="w-full min-h-[calc(100vh-80px)] p-4 flex flex-col items-center justify-center text-center">
      {/* <h1 className="text-3xl font-semibold">
        { PAGES_LANG.NOT_FOUND_TITLE }
      </h1>
      <p className="mt-2 text-muted">
        { PAGES_LANG.NOT_FOUND_TEXT }
      </p>
      <Button
        className="mt-6"
        variant="primary"
        onPress={ () => navigate('/') }
      >
        { PAGES_LANG.BACK_HOME }
      </Button> */}
      not found
    </section>
  );
}

export default NotFound;
