import { isNotNil } from 'ramda';
import { supabase } from './supabase';

const EDITABLE_PROFILE_FIELDS = ['name', 'avatar_url'];

export const profileService = {
  getProfile: async (profileId) => {
    const params = isNotNil(profileId) ? { p_profile_id: profileId } : {};
    const { data, error } = await supabase.rpc('get_profile', params).single();
      
    if (error) {
      throw error;
    }

    return data;
  },

  updateProfile: async (profileId, changes = {}) => {
    const editableChanges = Object.fromEntries(
      Object.entries(changes).filter(([field]) => (
        EDITABLE_PROFILE_FIELDS.includes(field)
      ))
    );

    if (Object.keys(editableChanges).length === 0) {
      throw new Error('No hay cambios de perfil permitidos para guardar.');
    }

    const { error } = await supabase
      .from('profiles')
      .update(editableChanges)
      .eq('id', profileId);

    if (error) {
      throw error;
    }

    return profileService.getProfile(profileId);
  }
};
