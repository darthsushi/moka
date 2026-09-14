import { Typography } from '@heroui/react';

import { Popup } from 'react-map-gl/mapbox';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM } from '@/settings/langs.settings';
import { Card } from '@heroui/react';
import { Animations } from '@/components/animations';

function PlacementMapPopup({
  placement,
  onClose,
  onViewDetails
}) {
  if (!placement) return null;

  const latitude = Number(placement.latitude);
  const longitude = Number(placement.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return (
    <Popup
      latitude={latitude}
      longitude={longitude}
      anchor="bottom"
      offset={ 48 }
      closeButton={false}
      closeOnClick={false}
      onClose={onClose}
      style={ { width: '300px' } }
    >
      <PopupContent
        placement={placement}
        onClose={onClose}
        onViewDetails={onViewDetails}
      />
    </Popup>
  );
}

function PopupContent({
  placement,
  /* onClose, */
  onViewDetails
}) {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM[language];

  return (
    <Animations.HoverCard disableHoverAnimation tabAnimation>
      <Card
        onClick={ () => onViewDetails?.(placement) }
        className="w-full p-2 shadow-2xl rounded-4xl cursor-pointer select-none"
      >
        <Card.Content className="grid grid-cols-3 gap-1">
          <div className="col-span-1 h-20 rounded-4xl overflow-hidden bg-surface-secondary">
            {/* Poner imagen aqui */}
          </div>
          <div className="col-span-2 row-span-2">
            <Typography
              type="body-sm"
              className="font-semibold"
            >
              { placement.code }
            </Typography>
            <Typography
              type="body-xs"
              className="truncate text-default-500"
            >
              { SYSTEM_LANG.PLACEMENT.TYPES[placement.type] }
            </Typography>
          </div>
        </Card.Content>
      </Card>
    </Animations.HoverCard>
  );
}

export default PlacementMapPopup;
