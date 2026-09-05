import { Surface, Typography } from '@heroui/react';
import { Icon } from '@/components/ui';

function LocationCell({ display_name, city, country, state }) {

  return (
    <Surface className="flex items-center gap-1 cursor-pointer max-w-fit pr-3 py-1 rounded-3xl">
      <div className="flex items-center justify-center size-12">
        <Icon name="map" filled />
      </div>
      <div className="flex flex-col max-w-80">
        <Typography type="body-sm" className="truncate">
          { display_name }
        </Typography>
        <Typography type="body-xs" className="truncate">
          { city }, { state }, { country }
        </Typography>
      </div>
    </Surface>
  );
}

export default LocationCell;
