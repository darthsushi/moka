import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { placementsService } from '@/services/placements.service';

export const DEFAULT_PUBLIC_FILTERS = Object.freeze({
  search: '',
  country: null,
  state: null,
  city: null,
  type: null
});

export const usePublicPlacements = ({
  initialPageSize = 24,
  initialFilters = DEFAULT_PUBLIC_FILTERS,
  searchDebounceMs = 400
} = {}) => {
  const [placements, setPlacements] = useState([]);
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_PUBLIC_FILTERS,
    ...initialFilters
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialFilters.search ?? DEFAULT_PUBLIC_FILTERS.search
  );
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const requestFilters = useMemo(() => ({
    search: debouncedSearch,
    country: filters.country,
    state: filters.state,
    city: filters.city,
    type: filters.type
  }), [
    debouncedSearch,
    filters.country,
    filters.state,
    filters.city,
    filters.type
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search ?? '');
    }, Math.max(0, searchDebounceMs));

    return () => window.clearTimeout(timeoutId);
  }, [filters.search, searchDebounceMs]);

  const fetchPlacements = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await placementsService.getPublicPlacements({
        pageSize: initialPageSize,
        filters: requestFilters
      });

      if (requestId !== requestIdRef.current) return;

      setPlacements(result.placements);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setPlacements([]);
      setNextCursor(null);
      setHasMore(false);
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [initialPageSize, requestFilters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchPlacements, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [fetchPlacements]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading || isLoadingMore) {
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await placementsService.getPublicPlacements({
        pageSize: initialPageSize,
        cursor: nextCursor,
        filters: requestFilters
      });

      if (requestId !== requestIdRef.current) return;

      setPlacements(currentPlacements => [
        ...currentPlacements,
        ...result.placements
      ]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [
    hasMore,
    initialPageSize,
    isLoading,
    isLoadingMore,
    nextCursor,
    requestFilters
  ]);

  const updateFilters = useCallback((changes) => {
    setFilters(currentFilters => ({
      ...currentFilters,
      ...changes
    }));
    setNextCursor(null);
    setHasMore(false);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_PUBLIC_FILTERS,
      ...initialFilters
    });
    setNextCursor(null);
    setHasMore(false);
  }, [initialFilters]);

  return {
    placements,
    filters,
    hasMore,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    updateFilters,
    clearFilters,
    loadMore,
    refetch: fetchPlacements
  };
};
