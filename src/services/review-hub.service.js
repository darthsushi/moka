import { supabase } from './supabase';
import { normalizeFaceImages } from '@/helpers/placement.helpers';

const rpc = async (name, params = {}) => {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data;
};

export const reviewHubService = {
  list: ({ tab, search, status, page, pageSize, onlyOrphaned }) => rpc('review_hub_list', {
    p_tab: tab, p_search: search, p_status: status, p_page: page,
    p_page_size: pageSize, p_only_orphaned: onlyOrphaned
  }),
  detail: async (id) => {
    const data = await rpc('review_hub_detail', { p_placement_id: id });
    return {
      ...data,
      placement: { ...data.placement, coordinates: `${data.placement.latitude},${data.placement.longitude}` },
      faces: (data.faces ?? []).map(face => ({ ...face, images: normalizeFaceImages(face.images) }))
    };
  },
  reviewers: () => rpc('review_hub_reviewers'),
  act: ({ placement, action, reviewerId = null, message = null }) => rpc('review_hub_action', {
    p_placement_id: placement.id, p_expected_revision: placement.review_revision,
    p_action: action, p_reviewer_id: action === 'reassign' ? reviewerId?.trim() || null : null,
    p_message: message?.trim() || null
  })
};
