import { supabase } from './supabase';
import { SUPABASE } from '../settings/keys.settings';

const PROFILE_AVATAR_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const getProfileAvatarPath = (avatarUrl, userId) => {
  if (typeof avatarUrl !== 'string' || !avatarUrl || !userId) {
    return null;
  }

  try {
    const url = new URL(avatarUrl);
    const bucketPath = `/storage/v1/object/public/${SUPABASE.STORAGE.PROFILE_AVATARS_STORAGE}/`;
    const bucketPathIndex = url.pathname.indexOf(bucketPath);

    if (bucketPathIndex === -1) {
      return null;
    }

    const filePath = decodeURIComponent(
      url.pathname.slice(bucketPathIndex + bucketPath.length)
    );

    return filePath.startsWith(`${userId}/`) ? filePath : null;
  } catch {
    return null;
  }
};

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

    return { filePath, publicUrl: publicData.publicUrl };
  },

  async removePlacementImages(filePaths) {
    if (!filePaths.length) return;
    const { error } = await supabase.storage
      .from(SUPABASE.STORAGE.PLACEMENTS_STORAGE).remove(filePaths);
    if (error) throw error;
  },

  getPlacementImagePath(imageUrl, userId) {
    if (!imageUrl || !userId) return null;
    try {
      const url = new URL(imageUrl);
      const prefix = `/storage/v1/object/public/${SUPABASE.STORAGE.PLACEMENTS_STORAGE}/`;
      const start = url.pathname.indexOf(prefix);
      if (start < 0 || url.origin !== new URL(import.meta.env.VITE_SUPABASE_URL).origin) return null;
      const path = decodeURIComponent(url.pathname.slice(start + prefix.length));
      return path.startsWith(`${userId}/`) ? path : null;
    } catch { return null; }
  },

  async uploadProfileAvatar(file, userId) {
    const fileExtension = PROFILE_AVATAR_EXTENSIONS[file.type];

    if (!fileExtension) {
      throw new Error('INVALID_AVATAR');
    }

    const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;
    const { error } = await supabase.storage
      .from(SUPABASE.STORAGE.PROFILE_AVATARS_STORAGE)
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from(SUPABASE.STORAGE.PROFILE_AVATARS_STORAGE)
      .getPublicUrl(filePath);

    return {
      filePath,
      publicUrl: data.publicUrl
    };
  },

  async removeProfileAvatar(filePath) {
    if (!filePath) {
      return;
    }

    const { error } = await supabase.storage
      .from(SUPABASE.STORAGE.PROFILE_AVATARS_STORAGE)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  },

  getProfileAvatarPath
};
