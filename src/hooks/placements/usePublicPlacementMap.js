import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { placementsService } from '@/services/placements.service';

const DEFAULT_MAP_LIMIT = 1000;
const MAP_BOUNDS_PRECISION = 6;
const EMPTY_MAP_FILTERS = Object.freeze({});

const normalizeCoordinate = (value) => (
  Number(Number(value).toFixed(MAP_BOUNDS_PRECISION))
);

const normalizeViewport = (bounds) => ({
  south: normalizeCoordinate(bounds.south),
  west: normalizeCoordinate(bounds.west),
  north: normalizeCoordinate(bounds.north),
  east: normalizeCoordinate(bounds.east)
});

const areViewportsEqual = (currentViewport, nextViewport) => (
  currentViewport !== null &&
  currentViewport.south === nextViewport.south &&
  currentViewport.west === nextViewport.west &&
  currentViewport.north === nextViewport.north &&
  currentViewport.east === nextViewport.east
);

export const usePublicPlacementMap = ({
  enabled = true,
  limit = DEFAULT_MAP_LIMIT,
  filters = EMPTY_MAP_FILTERS
} = {}) => {
  const [placements, setPlacements] = useState([]);
  const [viewport, setViewport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const viewportRef = useRef(null);
  const filtersRef = useRef(filters);
  const enabledRef = useRef(enabled);

  const fetchPlacements = useCallback(async (
    bounds,
    requestFilters
  ) => {
    if (!enabled || !bounds) return;

    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const data =
        await placementsService.getPublicPlacementsInView({
          ...bounds,
          limit,
          filters: requestFilters
        });

      if (requestId !== requestIdRef.current) return;

      setPlacements(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setPlacements([]);
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    enabled,
    limit
  ]);

  const updateViewport = useCallback((bounds) => {
    const nextViewport = normalizeViewport(bounds);
    const currentViewport = viewportRef.current;

    if (areViewportsEqual(currentViewport, nextViewport)) {
      return;
    }

    viewportRef.current = nextViewport;
    setViewport(nextViewport);

    fetchPlacements(
      nextViewport,
      filtersRef.current
    );
  }, [fetchPlacements]);

  const refetch = useCallback(() => {
    if (!viewportRef.current) return;

    return fetchPlacements(
      viewportRef.current,
      filtersRef.current
    );
  }, [fetchPlacements]);

  useEffect(() => {
    const filtersChanged =
      filtersRef.current !== filters;

    const becameEnabled =
      !enabledRef.current && enabled;

    filtersRef.current = filters;
    enabledRef.current = enabled;

    if (
      !enabled ||
      !viewportRef.current ||
      (!filtersChanged && !becameEnabled)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchPlacements(
        viewportRef.current,
        filters
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [
    enabled,
    filters,
    fetchPlacements
  ]);

  return {
    placements,
    viewport,
    isLoading,
    error,
    updateViewport,
    refetch
  };
};
