import { useCallback, useMemo, useState } from 'react';
import { Skeleton, ToggleButton, Typography } from '@heroui/react';

import { isNotNil } from '@/helpers/ramda.helpers';
import { getGreeting } from '@/helpers/utilities.helpers';
import { useAuth, useLanguage, useUI } from '@/hooks/contexts';
import { usePublicPlacementFilterOptions, usePublicPlacements } from '@/hooks/placements';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import { Header, NavBar, SearchInput, FiltersList, Icon } from '@/components/ui';
import Map from './elements/Map';
import PlacementsList from './elements/PlacementList';
import PlacementDetailsDialog from './elements/PlacementDetailsDialog';

const PUBLIC_FILTER_NAMES = ['country', 'state', 'city', 'type'];

function Home() {
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [detailsPlacement, setDetailsPlacement] = useState(null);
  const [mapViewport, setMapViewport] = useState(null);

  const { isAuthenticated, loading, profile } = useAuth();
  const { language } = useLanguage();
  const { isMapOpen, setIsMapOpen } = useUI();
  const { options, isLoading: areOptionsLoading, error: optionsError } = usePublicPlacementFilterOptions();
  const {
    placements,
    filters,
    isLoading,
    requestFilters,
    updateFilters,
  } = usePublicPlacements({
    searchDebounceMs: 700,
    viewport: isMapOpen ? mapViewport : null
  });
  const SYSTEM_LANG = SYSTEM_LANGS[language];
  const publicFilters = useMemo(() => [
    {
      name: 'country', translationKey: 'COUNTRY', defaultExpended: true,
      initialValues: options.countries.map(({ key }) => key),
      options: options.countries.map(({ key, label }) => ({ id: key, label }))
    },
    {
      name: 'state', translationKey: 'STATE',
      initialValues: options.states.map(({ key }) => key),
      options: options.states.map(({ key, label, country }) => ({
        id: key, label: [label, country].filter(Boolean).join(', ')
      }))
    },
    {
      name: 'city', translationKey: 'CITY',
      initialValues: options.cities.map(({ key }) => key),
      options: options.cities.map(({ key, label, state, country }) => ({
        id: key, label: [label, state, country].filter(Boolean).join(', ')
      }))
    },
    {
      name: 'type', translationKey: 'TYPE',
      initialValues: options.types.map(({ value }) => value),
      options: options.types.map(({ value }) => ({ id: value, translationKey: value }))
    }
  ].filter(({ options: filterOptions }) => filterOptions.length > 0), [options]);
  const activeFiltersCount = PUBLIC_FILTER_NAMES.filter(name => filters[name]?.length > 0).length;
  
  const translationKeyGreeting = getGreeting();
  const [firstName] = isNotNil(profile) ? profile.name.split(' ') : [null];
  const displayGreeting = isNotNil(firstName) && `${SYSTEM_LANG.TEXTS[translationKeyGreeting]}, ${firstName}`;

  const handleSearchChange = (value) => {
    updateFilters({ search: value });
  }

  const handleApplyFilters = (selected) => {
    if (!selected) {
      updateFilters({ country: null, state: null, city: null, type: null });
      return;
    }

    const selection = (name, available, mapOption) => {
      const chosen = selected[name] ?? [];
      return chosen.length === available.length
        ? null
        : available.filter(option => chosen.includes(option.key ?? option.value)).map(mapOption);
    };

    updateFilters({
      country: selection('country', options.countries, option => option.country_code),
      state: selection('state', options.states, option => ({
        country_code: option.country_code,
        subdivision_code: option.subdivision_code,
        value: option.value
      })),
      city: selection('city', options.cities, option => ({
        country_code: option.country_code,
        subdivision_code: option.subdivision_code,
        state: option.state,
        value: option.value
      })),
      type: selection('type', options.types, option => option.value)
    });
  };

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
            defaultValue={ filters.search }
          />
          { !areOptionsLoading && !optionsError &&
            <FiltersList
              tableName="placements"
              filters={ publicFilters }
              hasActiveFilters={ activeFiltersCount > 0 }
              activeFiltersCount={ activeFiltersCount }
              onApplyingFilters={ handleApplyFilters }
            />
          }
          <ToggleButton
            isSelected={ isMapOpen }
            variant="tertiary"
            className="text-lg"
            onChange={ setIsMapOpen }
          >
            <Icon name="map-search" />
          </ToggleButton>
        </NavBar>
        { optionsError && <p role="alert" className="px-4 text-danger">{ SYSTEM_LANG.ERRORS.UNEXPECTED_ERROR }</p> }
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
