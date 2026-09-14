import { useCallback, useState } from 'react';
import { Skeleton, ToggleButton, Typography } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth, useLanguage, useUI } from '@/hooks/contexts';
import { usePublicPlacements } from '@/hooks/placements';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import { Header, NavBar, SearchInput, FiltersList, Icon } from '@/components/ui';
import Map from './elements/Map';
import PlacementsList from './elements/PlacementList';
import PlacementDetailsDialog from './elements/PlacementDetailsDialog';

function Home() {
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [detailsPlacement, setDetailsPlacement] = useState(null);
  const [mapViewport, setMapViewport] = useState(null);

  const { isAuthenticated, loading, profile } = useAuth();
  const { language } = useLanguage();
  const { isMapOpen, setIsMapOpen } = useUI();
  const {
    placements,
    filters,
    hasMore,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    requestFilters,
    updateFilters,
    /* clearFilters,
    loadMore,
    refetch */
  } = usePublicPlacements({
    searchDebounceMs: 700,
    viewport: isMapOpen ? mapViewport : null
  });
  console.log({ filters, hasMore, nextCursor, isLoading, isLoadingMore, error, placements, requestFilters });

  const SYSTEM_LANG = SYSTEM_LANGS[language];
  
  const translationKeyGreeting = getGreeting();
  const [firstName] = isNotNil(profile) ? profile.name.split(' ') : [null];
  const displayGreeting = isNotNil(firstName) && `${SYSTEM_LANG.TEXTS[translationKeyGreeting]}, ${firstName}`;

  const handleSearchChange = (value) => {
    updateFilters({ search: value });
  }

  const handleExplorePlacement = (placement) => {
    // Creamos una referencia nueva para que "Explorar" vuelva a ejecutar
    // el flyTo incluso si es el mismo placement seleccionado anteriormente.
    setSelectedPlacement({
      ...placement
    });

    if (!isMapOpen) {
      setIsMapOpen(true);
    }
  };

  const handleViewPlacementDetails = (placement) => {
    setDetailsPlacement(placement);
  };

  const handleDetailsOpenChange = (isOpen) => {
    if (!isOpen) {
      setDetailsPlacement(null);
    }
  };

  const handleMapViewportChange = useCallback((nextViewport) => {
    setMapViewport(currentViewport => {
      if (
        currentViewport &&
        currentViewport.south ===
          nextViewport.south &&
        currentViewport.west ===
          nextViewport.west &&
        currentViewport.north ===
          nextViewport.north &&
        currentViewport.east ===
          nextViewport.east
      ) {
        return currentViewport;
      }

      return nextViewport;
    });
  }, []);

  return (
    <section className="w-full h-dvh flex flex-wrap overflow-y-auto"> 
      <Header>
        <div className="w-full h-full flex items-center gap-2">
          { 
            loading ?
              <Skeleton className="w-[90%] h-[70%] rounded-3xl" />
            : 
              (
                isAuthenticated &&
                <Typography type="h5" className="truncate">
                  <p className="truncate">
                    { displayGreeting }
                  </p>
                </Typography>
              )
          }
        </div>
      </Header>
      <div
        className={ `transition-all ${ isMapOpen ? 'w-[50%]' : 'w-full'}` }
        style={ { minHeight: 'calc(100% - 80px)' } }
      >
        <NavBar stickyTop={ 20 } className="flex flex-row gap-2 items-center">
          <SearchInput
            isDisabled={ isLoading }
            name={ 'placements' }
            onChange={ handleSearchChange }
            placeholder={ SYSTEM_LANG.TEXTS.FIND_BY_PLACEMENT }
            
          />
          <FiltersList
            tableName={ 'placements' }
            filters={ [] }
            hasActiveFilters={ false }

            isPending={ false }
            activeFiltersCount={ 0 }
            filtersActived={ [] }
            isDisabled={ false }

            clearFilters={ () => updateFilters({ search: '' }) }
            onApplyingFilters={ (e) => { console.log('onApplyingFilters', e) } }
          />
          <ToggleButton
            isSelected={ isMapOpen }
            variant="tertiary"
            className="text-lg"
            onChange={ setIsMapOpen }
          >
            <Icon name="map-search" />
          </ToggleButton>
        </NavBar>
        <PlacementsList
          placements={placements}
          isFetchingData={isLoading}
          onExplorePlacement={handleExplorePlacement}
          onViewDetails={handleViewPlacementDetails}
          selectedPlacement={selectedPlacement}
        />
      </div>
      <Map
        filters={ requestFilters }
        selectedPlacement={ selectedPlacement }
        onViewportChange={ handleMapViewportChange }
        onSelectPlacement={ setSelectedPlacement }
        onViewDetails={handleViewPlacementDetails}
      />
      <PlacementDetailsDialog
        placement={detailsPlacement}
        onOpenChange={handleDetailsOpenChange}
      />
    </section>
  );
}

export default Home;
