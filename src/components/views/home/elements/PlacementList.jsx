import { useEffect } from 'react';

import { usePublicPlacements } from '@/hooks/usePublicPlacements';
import { useUI } from '@/hooks/useUI.hook';

import FilterBar from './FilterBar';
import PlacementItemCard from './PlacementItemCard';

function PlacementsList() {
  const { isMapOpen, isSidebarOpen } = useUI();
  const { refetch, placements/* , isLoading, error */ } = usePublicPlacements();

  const isBothOpen = isMapOpen && isSidebarOpen;
  const gridSize = isBothOpen ? 'grid-cols-2'
      : (isMapOpen ? 'grid-cols-2' : (isSidebarOpen ? 'grid-cols-3' : 'grid-cols-4'));

  useEffect(() => {
    refetch();
    console.log('fetch');
  }, [refetch]);

  return (
    <div className={ `h-fit transition-all ${ isMapOpen ? 'w-[50%]' : 'w-full'}` }>
      <FilterBar /> 
      <div className={ `w-full p-2 grid gap-1 ${ gridSize }` }>
        { placements.map((placement, index) => <PlacementItemCard key={ index } placement={ placement } />) }
      </div>
    </div>
  );
}

export default PlacementsList;
