import { Icon } from '@/components/ui';
import { Chip } from '@heroui/react';
import { Typography } from '@heroui/react';

function DetailsCell({ type, faces_count, structure_height }) {

  return (
    <div className="flex flex-col gap-1">
      <Typography type="body-sm" weight="light" className="truncate">
        { type }
      </Typography>
      <div className="w-full h-5 flex gap-1">
        <Chip className="flex items-center gap-1">
          <Icon filled name="faces" />
          { faces_count }
        </Chip>
        <Chip className="flex items-center gap-1">
          <Icon filled name="height" />
          { structure_height }
        </Chip>
      </div>
    </div>
  );
}

export default DetailsCell;
