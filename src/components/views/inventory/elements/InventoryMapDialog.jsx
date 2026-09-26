import { useCallback, useEffect, useRef, useState } from 'react';
import MapboxMap, { NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Dialog } from '@/components/ui';
import PlacementMapMarker from '@/components/views/home/elements/PlacementMapMarker';
import PlacementMapPopup from '@/components/views/home/elements/PlacementMapPopup';
import { useLanguage } from '@/hooks/contexts';
import { TABLE_LANGS } from '@/settings/langs.settings';
import { placementsService } from '@/services/placements.service';

const DEFAULT_VIEW = { longitude: -89.6237, latitude: 20.9674, zoom: 12 };

function InventoryMapDialog({ userId, filters, initialPlacement, onClose, onViewDetails }) {
  const { language } = useLanguage();
  const labels = TABLE_LANGS[language].INVENTORY;
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const requestId = useRef(0);
  const [bounds, setBounds] = useState(null);
  const [search, setSearch] = useState(filters.search ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
  const [placements, setPlacements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const latitude = Number(initialPlacement?.latitude);
  const longitude = Number(initialPlacement?.longitude);
  const initialViewState = initialPlacement && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude, zoom: 12 }
    : DEFAULT_VIEW;

  const updateBounds = useCallback(() => {
    const next = mapRef.current?.getBounds();
    if (!next) return;
    setBounds({
      south: Math.max(-90, next.getSouth()),
      west: next.getWest(),
      north: Math.min(90, next.getNorth()),
      east: next.getEast()
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!bounds || !userId) return;
    const currentId = ++requestId.current;
    // Loading and stale results are managed together so moving the map never
    // replaces a newer viewport with a slower response from an earlier one.
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await placementsService.getInventoryPlacementsInView({
          userId,
          bounds,
          filters: { ...filters, search: debouncedSearch }
        });
        if (requestId.current === currentId) {
          setPlacements(results);
          setSelected(previous => results.find(item => item.id === previous?.id) ?? null);
        }
      } catch (fetchError) {
        if (requestId.current === currentId) {
          setError(fetchError);
          setPlacements([]);
        }
      } finally {
        if (requestId.current === currentId) setIsLoading(false);
      }
    }, 0);
    return () => {
      if (requestId.current === currentId) requestId.current = currentId + 1;
      window.clearTimeout(timer);
    };
  }, [bounds, userId, filters, debouncedSearch]);

  useEffect(() => {
    const element = mapContainerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
      updateBounds();
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [updateBounds]);

  const selectPlacement = (placement) => {
    setSelected(placement);
    if (placement) {
      mapRef.current?.flyTo({
        center: [Number(placement.longitude), Number(placement.latitude)],
        zoom: Math.max(mapRef.current?.getZoom() ?? 12, 15),
        duration: 700
      });
    }
  };

  return (
    <Dialog isModalOpen setIsModalOpen={ isOpen => { if (!isOpen) onClose(); } }
      size="cover" title={ labels.FIND_ON_MAP }>
      <div ref={ mapContainerRef } className="relative h-[min(78dvh,760px)] min-h-100 w-full overflow-hidden rounded-b-3xl">
        <MapboxMap
          ref={ mapRef }
          mapboxAccessToken={ import.meta.env.VITE_MAPBOX_ACCESS_TOKEN }
          initialViewState={ initialViewState }
          mapStyle="mapbox://styles/mapbox/standard"
          style={{ width: '100%', height: '100%' }}
          onLoad={ updateBounds }
          onMoveEnd={ updateBounds }
          onClick={ () => setSelected(null) }
        >
          <NavigationControl position="bottom-right" showCompass showZoom />
          { placements.map(placement => <PlacementMapMarker
            key={ placement.id }
            placement={ placement }
            isSelected={ selected?.id === placement.id }
            onClick={ selectPlacement }
          />) }
          <PlacementMapPopup
            placement={ selected }
            onClose={ () => setSelected(null) }
            onViewDetails={ onViewDetails }
          />
        </MapboxMap>
        <section aria-label={ labels.MAP_RESULTS }
          className="absolute bottom-3 left-3 top-auto z-10 flex max-h-[46%] w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-default bg-background shadow-xl sm:bottom-4 sm:left-4 sm:top-4 sm:max-h-none sm:w-80">
          <div className="shrink-0 border-b border-default p-3">
            <label htmlFor="inventory-map-search" className="sr-only">{ labels.SEARCH_BY_ID }</label>
            <input id="inventory-map-search" type="search" value={ search }
              onChange={ event => setSearch(event.target.value) }
              placeholder={ labels.SEARCH_BY_ID }
              className="w-full rounded-xl border border-default bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            <p className="mt-2 text-xs text-default-500" role="status">
              { isLoading ? labels.MAP_LOADING : `${placements.length} ${labels.MAP_RESULTS}` }
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            { error && <p role="alert" className="p-3 text-sm text-danger">{ labels.MAP_ERROR }</p> }
            { !error && !isLoading && placements.length === 0 &&
              <p className="p-3 text-sm text-default-500">{ labels.MAP_EMPTY }</p> }
            { placements.map(placement => (
              <button key={ placement.id } type="button" onClick={ () => selectPlacement(placement) }
                aria-pressed={ selected?.id === placement.id }
                className={`mb-2 w-full rounded-xl border p-3 text-left transition-colors hover:bg-surface-secondary ${selected?.id === placement.id ? 'border-primary bg-surface-secondary' : 'border-default bg-background'}`}>
                <span className="block font-semibold">{ placement.code }</span>
                <span className="block truncate text-sm text-default-500">{ placement.display_name || [placement.city, placement.state].filter(Boolean).join(', ') }</span>
                <span className="block text-xs text-default-500">{ labels[placement.type] } · { labels[placement.owner_status?.toUpperCase()] }</span>
              </button>
            )) }
          </div>
        </section>
      </div>
    </Dialog>
  );
}

export default InventoryMapDialog;
