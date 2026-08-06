import { useEffect } from 'react';

import { isEmpty, not } from '@/helpers/ramda.helpers';
import { useUI } from '@/hooks/contexts';
import { usePublicPlacements } from '@/hooks/placements';

import FilterBar from './FilterBar';
import PlacementItemCard from './PlacementItemCard';
import PlacementsListSkeleton from './PlacementListSkeleton';
import EmptyContent from '../../alerts/EmptyContent.view';

function PlacementsList() {
  const { isMapOpen, isSidebarOpen } = useUI();
  const { refetch, placements, isLoading/* , error */ } = usePublicPlacements();

  const isBothOpen = isMapOpen && isSidebarOpen;
  const gridSize = isBothOpen ? 'grid-cols-2'
      : (isMapOpen ? 'grid-cols-2' : (isSidebarOpen ? 'grid-cols-3' : 'grid-cols-4'));

  useEffect(() => {
    refetch();
    console.log('fetch');
  }, [refetch]);

  if (not(isLoading) && isEmpty(placements)) {
    return <EmptyContent />
  }

  return (
    <div
      className={ `transition-all ${ isMapOpen ? 'w-[50%]' : 'w-full'}` }
      style={{
        minHeight: 'calc(100% - 80px)'
      }}
    >
      <FilterBar /> 
      <div className={ `w-full p-2 grid gap-1 ${ gridSize }` }>
        { isLoading && <PlacementsListSkeleton /> }
        { not(isLoading) && placements.map((placement, index) => <PlacementItemCard key={ index } placement={ placement } />) }
      </div>
    </div>
  );
}

export default PlacementsList;
