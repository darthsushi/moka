import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui';
import PlacementDetails from '@/components/views/placements/PlacementDetails.view';

function PlacementDetailsDialog() {
  const navigate = useNavigate();

  return (
    <Dialog
      isModalOpen
      setIsModalOpen={ (isOpen) => { if (!isOpen) navigate(-1); } }
      size="cover"
      showDefaultCloseButton={ false }
    >
      <PlacementDetails isDialog />
    </Dialog>
  );
}

export default PlacementDetailsDialog;
