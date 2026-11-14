import { supabase } from './supabase';

export const notificationsService = {
  async list(userId) {
    const [recent, unread] = await Promise.all([
      supabase.from('notifications')
        .select('id,kind,placement_id,placement_code,review_status,created_at,read_at')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null)
    ]);
    if (recent.error) throw recent.error;
    if (unread.error) throw unread.error;
    return { items: recent.data ?? [], unreadCount: unread.count ?? 0 };
  },

  async markRead(userId, id) {
    const { error } = await supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('id', id)
      .is('read_at', null);
    if (error) throw error;
  },

  async markAllRead(userId) {
    const { error } = await supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error) throw error;
  }
};
