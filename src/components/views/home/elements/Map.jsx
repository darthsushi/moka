import {
  useCallback,
  useEffect,
  useRef
} from 'react';
import { Card } from '@heroui/react';

import MapboxMap, { NavigationControl } from 'react-map-gl/mapbox';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useUI } from '@/hooks/contexts';
import { usePublicPlacementMap } from '@/hooks/placements';

import PlacementMapMarker from './PlacementMapMarker';
import PlacementMapPopup from './PlacementMapPopup';


const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -89.6237,
  latitude: 20.9674,
  zoom: 12
};

const RESIZE_SETTLE_DELAY = 120;

function Map({
  filters,
  selectedPlacement,
  onViewportChange,
  onSelectPlacement,
  onViewDetails
}) {
  const { isMapOpen } = useUI();

  const mapRef = useRef(null);
  const containerRef = useRef(null);

  const resizeFrameRef = useRef(null);
  const resizeSettledTimeoutRef = useRef(null);
  const isContainerResizingRef = useRef(false);

  const pendingFocusPlacementRef = useRef(null);

  const {
    placements,
    /* viewport,
    isLoading,
    error, */
    updateViewport
  } = usePublicPlacementMap({
    enabled: isMapOpen,
    filters
  });

  const syncViewport = useCallback(() => {
    if (!isMapOpen) return;

    const bounds = mapRef.current?.getBounds();

    if (!bounds) return;

    const nextViewport = {
      south: Number(bounds.getSouth().toFixed(6)),
      west: Number(bounds.getWest().toFixed(6)),
      north: Number(bounds.getNorth().toFixed(6)),
      east: Number(bounds.getEast().toFixed(6))
    };

    updateViewport(nextViewport);
    onViewportChange?.(nextViewport);
  }, [
    isMapOpen,
    onViewportChange,
    updateViewport
  ]);

  const focusPlacement = useCallback((placement) => {
    if (!placement || !isMapOpen) return false;

    const map = mapRef.current;
    const container = containerRef.current;

    const latitude = Number(placement.latitude);
    const longitude = Number(placement.longitude);

    if (
      !map ||
      !container ||
      container.clientWidth === 0 ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return false;
    }

    const currentZoom = map.getZoom();

    map.flyTo({
      center: [
        longitude,
        latitude
      ],
      zoom: Math.max(currentZoom, 16),
      duration: 1000
    });

    return true;
  }, [isMapOpen]);

  const handleMapLoad = useCallback(() => {
    if (isContainerResizingRef.current) return;

    syncViewport();
  }, [syncViewport]);

  const handleMoveEnd = useCallback(() => {
    if (isContainerResizingRef.current) return;

    syncViewport();
  }, [syncViewport]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      isContainerResizingRef.current = true;

      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        mapRef.current?.resize();
        resizeFrameRef.current = null;
      });

      if (resizeSettledTimeoutRef.current !== null) {
        window.clearTimeout(resizeSettledTimeoutRef.current);
      }

      resizeSettledTimeoutRef.current = window.setTimeout(() => {
        isContainerResizingRef.current = false;
        resizeSettledTimeoutRef.current = null;

        const pendingPlacement =
          pendingFocusPlacementRef.current;

        if (pendingPlacement) {
          const didFocus = focusPlacement(pendingPlacement);

          if (didFocus) {
            pendingFocusPlacementRef.current = null;

            return;
          }
        }

        syncViewport();
      }, RESIZE_SETTLE_DELAY);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();

      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      if (resizeSettledTimeoutRef.current !== null) {
        window.clearTimeout(resizeSettledTimeoutRef.current);
      }

      isContainerResizingRef.current = false;
    };
  }, [
    focusPlacement,
    syncViewport
  ]);

  useEffect(() => {
    if (!selectedPlacement) {
      pendingFocusPlacementRef.current = null;

      return;
    }

    if (!isMapOpen) {
      pendingFocusPlacementRef.current = selectedPlacement;

      return;
    }

    if (
      isContainerResizingRef.current ||
      containerRef.current?.clientWidth === 0
    ) {
      pendingFocusPlacementRef.current = selectedPlacement;

      return;
    }

    const didFocus = focusPlacement(selectedPlacement);

    if (!didFocus) {
      pendingFocusPlacementRef.current = selectedPlacement;
    }
  }, [
    selectedPlacement,
    isMapOpen,
    focusPlacement
  ]);
  // TODO: fix resize

  return (
    <div
      ref={containerRef}
      data-map
      className={`
        transition-all
        sticky top-20
        overflow-hidden
        p-3.5
        ${isMapOpen ? 'w-[50%]' : 'w-0'}
      `}
      style={{
        height: isMapOpen ? 'calc(100% - 80px)' : 'auto'
      }}
    >
      <Card variant="secondary" className="w-full p-0 h-full rounded-[20px] overflow-hidden shadow-xl">
        <Card.Content className="w-full p-0 overflow-hidden">
          <MapboxMap
            ref={mapRef}
            mapboxAccessToken={ MAPBOX_ACCESS_TOKEN }
            initialViewState={ INITIAL_VIEW_STATE }
            mapStyle="mapbox://styles/mapbox/standard"
            style={{
              width: '100%',
              height: '100%'
            }}
            onLoad={ handleMapLoad }
            onMoveEnd={ handleMoveEnd }
            onClick={ () => onSelectPlacement?.(null) }
          >
            <NavigationControl
              position="bottom-right"
              showCompass
              showZoom
            />

            {
              placements.map(placement => (
                <PlacementMapMarker
                  key={ placement.id }
                  placement={ placement }
                  isSelected={ selectedPlacement?.id === placement.id }
                  onClick={ onSelectPlacement }
                />
              ))
            }

            <PlacementMapPopup
              placement={selectedPlacement}
              onClose={() => onSelectPlacement?.(null)}
              onViewDetails={onViewDetails}
            />
          </MapboxMap>
        </Card.Content>
      </Card>
    </div>
  );
}

export default Map;
