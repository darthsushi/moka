import { useCallback, useEffect, useState } from 'react';
import { reviewHubService } from '@/services/review-hub.service';
import { useAuth } from '@/hooks/contexts';

const EMPTY_COUNTS = {};

export function useReviewHub({ tab, search, status, page, onlyOrphaned, refreshKey = 0, pageSize = 12 }) {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [request, setRequest] = useState({ key: null, data: null, error: null });
  const key = JSON.stringify([user?.id, tab, search, status, page, pageSize, onlyOrphaned, refresh, refreshKey]);
  const refetch = useCallback(() => setRefresh(value => value + 1), []);

  useEffect(() => {
    let active = true;
    // Debounce searches and ignore late responses after switching tabs/accounts.
    const timeout = setTimeout(() => {
      reviewHubService.list({ tab, search, status, page, pageSize, onlyOrphaned })
        .then(data => { if (active) setRequest({ key, data, error: null }); })
        .catch(error => { if (active) setRequest({ key, data: null, error }); });
    }, search ? 350 : 0);
    return () => { active = false; clearTimeout(timeout); };
  }, [key, tab, search, status, page, pageSize, onlyOrphaned]);

  const isLoading = request.key !== key;
  return {
    rows: isLoading ? [] : request.data?.rows ?? [],
    counts: request.data?.counts ?? EMPTY_COUNTS,
    total: isLoading ? 0 : request.data?.total ?? 0,
    error: isLoading ? null : request.error,
    isLoading, refetch, pageSize
  };
}
