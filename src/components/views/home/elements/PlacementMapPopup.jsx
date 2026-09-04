import {
  Button,
  Typography
} from '@heroui/react';

import { Popup } from 'react-map-gl/mapbox';

import { useLanguage } from '@/hooks/contexts';
import { SYSTEM } from '@/settings/langs.settings';

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
      offset={48}
      closeButton={false}
      closeOnClick={false}
      onClose={onClose}
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
  onClose,
  onViewDetails
}) {
  const { language } = useLanguage();

  const SYSTEM_LANG = SYSTEM[language];

  return (
    <div className="w-60 p-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography
            type="body-sm"
            className="font-semibold"
          >
            {placement.code}
          </Typography>

          <Typography
            type="body-xs"
            className="truncate text-default-500"
          >
            {
              SYSTEM_LANG.PLACEMENT.TYPES[
                placement.type
              ]
            }
          </Typography>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={onClose}
        >
          ×
        </Button>
      </div>

      <Button
        fullWidth
        size="sm"
        variant="tertiary"
        className="mt-3"
        onPress={() => onViewDetails?.(placement)}
      >
        {SYSTEM_LANG.BUTTONS.VIEW_DETAILS}
      </Button>
    </div>
  );
}

export default PlacementMapPopup;
