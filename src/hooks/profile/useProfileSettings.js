import { useAuth } from '@/hooks/contexts';
import { storageService } from '@/services/storage.service';

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

export const useProfileSettings = () => {
  const { profile, updateProfile, user } = useAuth();

  const updateName = async (name) => {
    const normalizedName = name?.trim();

    if (!normalizedName || normalizedName.length < 5) {
      throw new Error('NAME_TOO_SHORT');
    }

    return updateProfile({ name: normalizedName });
  };

  const updateAvatar = async (avatar) => {
    if (!user?.id) {
      throw new Error('AUTH_REQUIRED');
    }

    const previousAvatarPath = storageService.getProfileAvatarPath(
      profile?.avatar_url,
      user.id
    );

    if (avatar === null) {
      const updatedProfile = await updateProfile({ avatar_url: null });

      if (previousAvatarPath) {
        storageService.removeProfileAvatar(previousAvatarPath).catch(() => undefined);
      }

      return updatedProfile;
    }

    if (!(avatar instanceof File)) {
      throw new Error('INVALID_AVATAR');
    }

    if (avatar.size > MAX_AVATAR_SIZE) {
      throw new Error('AVATAR_TOO_LARGE');
    }

    const { filePath, publicUrl } = await storageService.uploadProfileAvatar(
      avatar,
      user.id
    );

    try {
      const updatedProfile = await updateProfile({ avatar_url: publicUrl });

      if (previousAvatarPath && previousAvatarPath !== filePath) {
        storageService.removeProfileAvatar(previousAvatarPath).catch(() => undefined);
      }

      return updatedProfile;
    } catch (error) {
      await storageService.removeProfileAvatar(filePath).catch(() => undefined);
      throw error;
    }
  };

  return {
    updateAvatar,
    updateName
  };
};
