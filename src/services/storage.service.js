import { supabase } from './supabase';
import { SUPABASE } from '../settings/keys.settings';

export const storageService = {
  async uploadPlacementImage(file, userId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { /* data, */ error } = await supabase.storage
      .from(SUPABASE.STORAGE.PLACEMENTS_STORAGE)
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(SUPABASE.STORAGE.PLACEMENTS_STORAGE)
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  }
};
