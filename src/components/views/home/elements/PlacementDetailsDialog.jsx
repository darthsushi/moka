import { Typography } from '@heroui/react';

import { Dialog } from '@/components/ui';

function PlacementDetailsDialog({
  placement,
  onOpenChange
}) {
  return (
    <Dialog
      isModalOpen={Boolean(placement)}
      setIsModalOpen={onOpenChange}
      size="cover"
    >
      {
        placement && (
          <Typography type="h5">
            {placement.code}
          </Typography>
        )
      }
    </Dialog>
  );
}

export default PlacementDetailsDialog;
