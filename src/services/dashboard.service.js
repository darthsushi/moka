import { supabase } from './supabase';
import { reviewHubService } from './review-hub.service';

async function countOwner(userId, statuses = null, ownerStatus = null) {
  let query = supabase.from('placements')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('owner_status', 'withdrawn');
  if (statuses) query = query.in('review_status', statuses);
  if (ownerStatus) query = query.eq('owner_status', ownerStatus);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export const dashboardService = {
  async owner(userId) {
    const [approved, reviewing, attention, paused, actionItems] = await Promise.all([
      countOwner(userId, ['approved']),
      countOwner(userId, ['pending', 'in_review']),
      countOwner(userId, ['rejected', 'suspended']),
      countOwner(userId, null, 'paused'),
      supabase.from('placements')
        .select('id,code,review_status,created_at')
        .eq('user_id', userId)
        .neq('owner_status', 'withdrawn')
        .in('review_status', ['rejected', 'suspended'])
        .order('created_at', { ascending: true })
        .limit(5)
    ]);
    if (actionItems.error) throw actionItems.error;
    return { approved, reviewing, attention, paused, items: actionItems.data ?? [] };
  },

  async review(isAdmin) {
    const request = (tab, status = '') => reviewHubService.list({
      tab, status, search: '', page: 1, pageSize: 5, onlyOrphaned: true
    });
    const [unassigned, minePending, mineReviewing, reassign] = await Promise.all([
      request('unassigned'),
      request('mine', 'pending'),
      request('mine', 'in_review'),
      isAdmin ? request('reassign') : Promise.resolve(null)
    ]);
    return {
      unassigned: unassigned.total,
      minePending: minePending.total,
      mineReviewing: mineReviewing.total,
      reassign: reassign?.total,
      items: [
        ...mineReviewing.rows.map(item => ({ ...item, queue: 'mine' })),
        ...minePending.rows.map(item => ({ ...item, queue: 'mine' })),
        ...unassigned.rows.map(item => ({ ...item, queue: 'unassigned' })),
        ...(reassign?.rows ?? []).map(item => ({ ...item, queue: 'reassign' }))
      ].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 5)
    };
  }
};
