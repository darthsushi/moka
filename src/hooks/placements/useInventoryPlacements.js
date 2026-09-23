import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { equals, isEmpty, isNil, not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { placementsService } from '@/services/placements.service';
import { equalsIgnoreOrderNative } from '@/helpers/utilities.helpers';

export const DEFAULT_INVENTORY_FILTERS = Object.freeze({
  search: '',
  faceCount: null,
  city: null,
  state: null,
  country: null,
  owner_status: null,
  review_status: null,
  visibility: null,
  type: null
});

const getActiveFilters = (initialFilters, filters, filtersToIgnore = []) => {
  // TODO: Ad support for new Set()?
  return Object.keys(filters)
    .filter((filterName) => {
      if (isNil(filters[filterName]) || isEmpty(filters[filterName]) || filtersToIgnore.includes(filterName)) {

        return false;
      }

      if (Array.isArray(filters[filterName])) {
        if (not(Array.isArray((initialFilters[filterName] || [])))) return false;

        return not(equalsIgnoreOrderNative(filters[filterName], (initialFilters[filterName] || [])));
      }

      return not(equals(filters[filterName], initialFilters[filterName]));
    });
};

export const useInventoryPlacements = ({
  scope = 'mine',
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
    city: filters.city,
    state: filters.state,
    country: filters.country,
    owner_status: filters.owner_status,
    review_status: filters.review_status,
    visibility: filters.visibility,
    type: filters.type
  }), [
    debouncedSearch,
    filters.city,
    filters.country,
    filters.faceCount,
    filters.state,
    filters.owner_status,
    filters.review_status,
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
        scope,
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
  }, [isAuthLoading, page, pageSize, requestFilters, scope, userId]);

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
    setFiltersState({ search: filters.search, ...initialFilters });
    setPageState(1);
  }, [initialFilters, filters.search]);

  const activeFilters = getActiveFilters(initialFilters, filters, ['search']);

  const hasFiltersAndSearch = getActiveFilters(initialFilters, filters).length > 0;

  return {
    placements,
    page,
    pageSize,
    total,
    totalPages,
    isLoading,
    isEmpty: not(isLoading) && placements.length === 0 && not(hasFiltersAndSearch),
    hasNoMatches: not(isLoading) && placements.length === 0 && hasFiltersAndSearch,
    error,
    filters,
    activeFilters,
    activeFiltersCount: activeFilters.length,
    hasActiveFilters: activeFilters.length > 0,
    setPage,
    setPageSize,
    updateFilters,
    clearFilters,
    refetch: fetchPlacements
  };
};
