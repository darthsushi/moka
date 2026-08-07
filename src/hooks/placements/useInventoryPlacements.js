import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { useAuth } from '@/hooks/contexts';
import { placementsService } from '@/services/placements.service';

export const DEFAULT_INVENTORY_FILTERS = Object.freeze({
  search: '',
  faceCount: null,
  status: null,
  visibility: null,
  type: null
});

const isActiveFilter = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined && value !== '';
};

export const useInventoryPlacements = ({
  initialPage = 1,
  initialPageSize = 10,
  initialFilters = DEFAULT_INVENTORY_FILTERS,
  searchDebounceMs = 400
} = {}) => {
  const { user, loading: isAuthLoading } = useAuth();
  const userId = user?.id;

  const [placements, setPlacements] = useState([]);
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [filters, setFiltersState] = useState(() => ({
    ...DEFAULT_INVENTORY_FILTERS,
    ...initialFilters
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(
    initialFilters.search ?? DEFAULT_INVENTORY_FILTERS.search
  );
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const requestFilters = useMemo(() => ({
    search: debouncedSearch,
    faceCount: filters.faceCount,
    status: filters.status,
    visibility: filters.visibility,
    type: filters.type
  }), [
    debouncedSearch,
    filters.faceCount,
    filters.status,
    filters.type,
    filters.visibility
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search ?? '');
    }, Math.max(0, searchDebounceMs));

    return () => window.clearTimeout(timeoutId);
  }, [filters.search, searchDebounceMs]);

  const fetchPlacements = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    const requestId = ++requestIdRef.current;

    if (!userId) {
      setPlacements([]);
      setTotal(0);
      setTotalPages(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await placementsService.getInventoryPlacements({
        userId,
        page,
        pageSize,
        filters: requestFilters
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setPlacements(result.placements);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setPlacements([]);
      setTotal(0);
      setTotalPages(0);
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthLoading, page, pageSize, requestFilters, userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchPlacements, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [fetchPlacements]);

  const setPage = useCallback((nextPage) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageSize = useCallback((nextPageSize) => {
    setPageState(1);
    setPageSizeState(Math.max(1, nextPageSize));
  }, []);

  const updateFilters = useCallback((changes) => {
    setFiltersState(currentFilters => ({
      ...currentFilters,
      ...changes
    }));
    setPageState(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({ ...DEFAULT_INVENTORY_FILTERS });
    setPageState(1);
  }, []);

  const activeFiltersCount = Object.values(filters)
    .filter(isActiveFilter)
    .length;

  return {
    placements,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    isEmpty: !isLoading && placements.length === 0,
    error,
    filters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
    setPage,
    setPageSize,
    updateFilters,
    clearFilters,
    refetch: fetchPlacements
  };
};
