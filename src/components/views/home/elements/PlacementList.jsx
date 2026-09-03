import { isEmpty, not } from '@/helpers/ramda.helpers';
import { useUI } from '@/hooks/contexts';

import PlacementItemCard from './PlacementItemCard';
import PlacementsListSkeleton from './PlacementListSkeleton';
import EmptyContent from '../../alerts/EmptyContent.view';

function PlacementsList({ placements, isFetchingData }) {
  const { isMapOpen, isSidebarOpen } = useUI();

  const isBothOpen = isMapOpen && isSidebarOpen;
  const gridSize = isBothOpen ? 'grid-cols-2'
      : (isMapOpen ? 'grid-cols-2' : (isSidebarOpen ? 'grid-cols-3' : 'grid-cols-4'));

  if (not(isFetchingData) && isEmpty(placements)) {
    return <EmptyContent />
  }

  return (
    <div className={ `w-full py-2 px-4 grid gap-2.5 mt-3 ${ gridSize }` }>
      { isFetchingData && <PlacementsListSkeleton /> }
      { not(isFetchingData) && placements.map((placement, index) => <PlacementItemCard key={ index } placement={ placement } />) }
    </div>
  );
}

export default PlacementsList;
