import { Typography } from '@heroui/react';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

function EmptyContent() {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM_LANGS[language];

  return (
    <section data-alerts-empty-content className="w-full flex justify-center items-center h-full min-h-60">
      <div data-alert-empty-message className="p-2">
        <Typography type="h3">
          { SYSTEM_LANG.TEXTS.NOTHING_TO_SHOW }
        </Typography>
      </div>
    </section>
  );
};

export default EmptyContent;