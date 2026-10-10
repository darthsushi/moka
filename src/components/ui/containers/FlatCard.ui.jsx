import { Surface } from '@heroui/react';

import { getValueOrDefault } from '@/helpers/utilities.helpers';
import { ROUNDED_CORNERS } from '@/settings/defaults.settings';

function FlatCard({
  children,
  className,
  rounded = 'md',
  ...props
}) {
  const currentRounded = getValueOrDefault(rounded, Object.keys(ROUNDED_CORNERS), 'md');

  return (
    <Surface
      { ...props }
      className={ `${ROUNDED_CORNERS[currentRounded]} p-3 ${className}` }
    >
      { children }
    </Surface>
  );
}

export default FlatCard;
