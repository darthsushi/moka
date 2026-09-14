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
          <>
            <Typography type="h5">
              {placement.code}
            </Typography>
            <ul>
              <li>
                Si es del propietario, mostrar controles 
              </li>
              <li>
                Que datos mostrar con sesion?
              </li>
              <li>
                Es necesario ocultar algun dato?
              </li>
              <li>
                
              </li>
            </ul>
          </>
        )
      }
    </Dialog>
  );
}

export default PlacementDetailsDialog;
