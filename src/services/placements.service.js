import { supabase } from './supabase';
import { applyListFilter, normalizeFaceCount, serializeDayRange } from '@/helpers/utilities.helpers';

const FULL_PLACEMENT_CODE_PATTERN = /^(?:[A-Z]{2}-[A-Z0-9]{1,3}|OTR)-\d+$/;

export const placementsService = {
  async createPlacement(formattedData, userId) {
    const { faces, ...placementData } = formattedData;

    // TODO: Remove all LOGS:
    console.log(placementData)

    const { data: placement, error: placementError } = await supabase
      .from('placements')
      .insert({
        ...placementData,
        user_id: userId
      })
      .select()
      .single();

    if (placementError) throw placementError;

    const facesToInsert = faces.map(face => ({
      ...face,
      day_range: serializeDayRange(face.day_range),
      placement_id: placement.id 
    }));

    const { data: createdFaces, error: facesError } = await supabase
      .from('placement_faces')
      .insert(facesToInsert)
      .select();

    if (facesError) throw facesError;

    return {
      placement: {
        ...placement,
        face_count: createdFaces.length
      },
      faces: createdFaces
    };
  },

  async getPublicPlacements() {
    const { data, error } = await supabase
      .from('placements')
      .select(`
        *,
        faces:placement_faces (*),
        owner:profiles!inner (
          id,
          name,
          avatar_url,
          status
        )
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .eq('profiles.status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  },

  async getInventoryPlacements({
    userId,
    page = 1,
    pageSize = 10,
    filters = {}
  } = {}) {
    if (!userId) {
      throw new Error('USER_ID_REQUIRED');
    }

    if (!Number.isInteger(page) || page < 1) {
      throw new Error('INVALID_PAGE');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
      throw new Error('INVALID_PAGE_SIZE');
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      search = '',
      faceCount = null,
      status = null,
      visibility = null,
      type = null
    } = filters;

    const normalizedSearch = typeof search === 'string'
      ? search.trim().toUpperCase()
      : '';
    const normalizedFaceCount = normalizeFaceCount(faceCount);

    let query = supabase
      .from('placements')
      .select(`
        id,
        user_id,
        code,
        face_count,
        type,
        latitude,
        longitude,
        structure_height,
        description,
        visibility,
        status,
        location,
        share_token,
        updated_at,
        created_at,
        faces:placement_faces (
          id,
          placement_id,
          display_width,
          display_height,
          period_price,
          day_range,
          images,
          updated_at,
          created_at
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (normalizedSearch) {
      query = FULL_PLACEMENT_CODE_PATTERN.test(normalizedSearch)
        ? query.eq('code', normalizedSearch)
        : query.ilike('code', `%${normalizedSearch}%`);
    }

    if (normalizedFaceCount !== null) {
      query = query.eq('face_count', normalizedFaceCount);
    }

    query = applyListFilter(query, 'status', status);
    query = applyListFilter(query, 'visibility', visibility);
    query = applyListFilter(query, 'type', type);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;

    return {
      placements: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
};
