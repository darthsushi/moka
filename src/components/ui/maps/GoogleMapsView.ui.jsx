import { useTranslation } from 'react-i18next';
import { Card } from '@heroui/react';
import { ROUNDED_CORNERS } from '@/settings/defaults.settings';

function GoogleMapsView({
    coordinates = '0,0',
    className = '',
    children,
  }) {
  const { t, i18n } = useTranslation();
  const [latitude, longitude] = coordinates.split(',');
  const MAP_URL = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed&hl=${i18n.resolvedLanguage}`;

  return (
    <Card
      className="w-full"
    >
      <Card.Header className={ `w-full ${className}` }>
        { children }
      </Card.Header>
      <Card.Content className={ `${ROUNDED_CORNERS.sm} w-full h-50 overflow-hidden shadow-md border border-default-200` }>
        <iframe
          title={ t('common:map.title') }
          src={ MAP_URL }
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Card.Content>
    </Card>
  );
};

export default GoogleMapsView;
