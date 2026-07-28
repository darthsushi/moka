import { supabase } from './supabase';

export const profileService = {
  // Obtiene el perfil público del usuario basado en su ID
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },

  // Aquí en el futuro puedes agregar funciones para actualizar el perfil, 
  // cambiar el tema (theme) o idioma (language), etc.
};
