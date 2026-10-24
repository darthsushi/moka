import {
  useEffect,
  useRef
} from 'react';
import { isEmpty, not } from '@/helpers/ramda.helpers';
import { useUI } from '@/hooks/contexts';

import PlacementItemCard from './PlacementItemCard';
import PlacementsListSkeleton from './PlacementListSkeleton';
import EmptyContent from '../../alerts/EmptyContent.view';

function PlacementsList({
  placements,
  selectedPlacement,
  isFetchingData,
  onExplorePlacement,
  onViewDetails
}) {
  const { isMapOpen, isSidebarOpen } = useUI();
  const listRef = useRef(null);

  const isBothOpen = isMapOpen && isSidebarOpen;
  const gridSize = isBothOpen ? 'grid-cols-2'
      : (isMapOpen ? 'grid-cols-2' : (isSidebarOpen ? 'grid-cols-3' : 'grid-cols-4'));

  useEffect(() => {
    if (!selectedPlacement?.id) return;

    const placementElement =
      listRef.current?.querySelector(
        `[data-placement-id="${selectedPlacement.id}"]`
      );

    if (!placementElement) return;

    placementElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }, [selectedPlacement?.id]);

  if (not(isFetchingData) && isEmpty(placements)) {
    return <EmptyContent />
  }

  return (
    <div ref={ listRef } className={ `w-full py-2 px-4 grid gap-2.5 mt-3 ${ gridSize }` }>
      { isFetchingData && <PlacementsListSkeleton /> }
      { not(isFetchingData) &&
        placements.map((placement) => (
          <PlacementItemCard
            key={ placement.id }
            placement={ placement }
            isMapOpen={ isMapOpen }
            isSelected={
              selectedPlacement?.id === placement.id
            }
            onExplorePlacement={onExplorePlacement}
            onViewDetails={onViewDetails}
          />
        ))
      }
    </div>
  );
}

export default PlacementsList;
