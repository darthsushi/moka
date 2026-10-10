import { Chip, Typography } from '@heroui/react';
import { Icon } from '@/components/ui';

function DetailsCell({
    type,
    visibility,
    visibilityDisplay
  }) {
  const VISIBILITY_ICON = {
    'public': 'public',
    'private': 'visibility_off',
    'unlisted': 'link',
  };

  const VISIBILITY_COLOR = {
    'public': 'success',
    'private': 'danger',
    'unlisted': 'warning',
  };

  return (
    <div className="flex flex-col gap-1">
      <Typography
        type="body-sm"
        weight="light"
        className="truncate"
      >
        { type }
      </Typography>
      <div className="w-full h-5 flex gap-1">
        <Chip
          variant="soft"
          color={ VISIBILITY_COLOR[visibility] }
          className="flex items-center gap-1"
        >
          <Icon
            filled
            name={ VISIBILITY_ICON[visibility] }
          />
          { visibilityDisplay }
        </Chip>
      </div>
    </div>
  );
}

export default DetailsCell;
