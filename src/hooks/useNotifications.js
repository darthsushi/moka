import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/contexts';
import { notificationsService } from '@/services/notifications.service';
import { supabase } from '@/services/supabase';

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;
  const [inbox, setInbox] = useState({ userId: null, items: [], unreadCount: 0 });
  const [error, setError] = useState({ userId: null, value: false });
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const currentRequest = ++requestId.current;
    try {
      const result = await notificationsService.list(userId);
      if (currentRequest !== requestId.current) return;
      setInbox({ userId, ...result });
      setError({ userId, value: false });
    } catch {
      if (currentRequest === requestId.current) setError({ userId, value: true });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const channel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}`
      }, () => { void refresh(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void refresh();
      });
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    const initialRefresh = window.setTimeout(() => { void refresh(); }, 0);
    return () => {
      requestId.current += 1;
      window.clearTimeout(initialRefresh);
      window.removeEventListener('focus', onFocus);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const markRead = async id => {
    await notificationsService.markRead(userId, id);
    await refresh();
  };
  const markAllRead = async () => {
    await notificationsService.markAllRead(userId);
    await refresh();
  };

  const currentInbox = inbox.userId === userId ? inbox : { items: [], unreadCount: 0 };
  return { items: currentInbox.items, unreadCount: currentInbox.unreadCount,
    loading: Boolean(userId && inbox.userId !== userId && error.userId !== userId),
    error: error.userId === userId && error.value, refresh, markRead, markAllRead };
}
