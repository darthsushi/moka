import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { useAuth } from '@/hooks/contexts';
import { placementsService } from '@/services/placements.service';

const EMPTY_OPTIONS = Object.freeze({
  countries: [],
  states: [],
  cities: [],
  faceCounts: []
});

export const useInventoryFilterOptions = () => {
  const { user, loading: isAuthLoading } = useAuth();
  const userId = user?.id;

  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fetchOptions = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    const requestId = ++requestIdRef.current;

    if (!userId) {
      setOptions(EMPTY_OPTIONS);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await placementsService.getInventoryFilterOptions();

      if (requestId !== requestIdRef.current) {
        return;
      }

      setOptions(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setOptions(EMPTY_OPTIONS);
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthLoading, userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchOptions, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [fetchOptions]);

  return {
    ...options,
    isLoading,
    isEmpty: !isLoading && [
      options.countries,
      options.states,
      options.cities,
      options.faceCounts
    ].every(values => values.length === 0),
    error,
    refetch: fetchOptions
  };
};
