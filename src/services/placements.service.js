import { supabase } from './supabase';

export const placementsService = {
  async createPlacement(formattedData, userId) {
    const { faces, ...placementData } = formattedData;

    const { data: placement, error: placementError } = await supabase
      .from('placements')
      .insert({
        ...placementData,
        user_id: userId
      })
      .select()
      .single();

    if (placementError) throw placementError;

    const facesToInsert = faces.map(actualFace => ({
      ...actualFace,
      placement_id: placement.id 
    }));

    const { data: createdFaces, error: facesError } = await supabase
      .from('placement_faces')
      .insert(facesToInsert)
      .select();

    if (facesError) throw facesError;

    return {
      placement,
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
  }
};