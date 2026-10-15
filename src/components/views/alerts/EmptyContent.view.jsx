import { useTranslation } from 'react-i18next';
import { Typography } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';

function EmptyContent({ children }) {
  const { t } = useTranslation();

  return (
    <section data-alerts-empty-content className="w-full flex justify-center items-center h-full min-h-60">
      <div data-alert-empty-message className="p-2">
        { isNotNil(children) ?
            children
          :
          <Typography type="h4">
            { t('common:texts.nothingToShow') }
          </Typography>
        }
      </div>
    </section>
  );
};

export default EmptyContent;
