import { isNotNil } from 'ramda';
import { supabase } from './supabase';

export const profileService = {
  getProfile: async (profileId) => {
    const params = isNotNil(profileId) ? { p_profile_id: profileId } : {};
    const { data, error } = await supabase.rpc('get_profile', params).single();
      
    if (error) {
      throw error;
    }

    return data;
  },

  // Aquí en el futuro puedes agregar funciones para actualizar el perfil
};
