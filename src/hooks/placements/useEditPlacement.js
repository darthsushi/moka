import { useState } from 'react';
import { useAuth } from '@/hooks/contexts';
import { IMAGE_VIEWS } from '@/helpers/placement.helpers';
import { storageService } from '@/services/storage.service';
import { placementsService } from '@/services/placements.service';

export const useEditPlacement = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const edit = async (values, original) => {
    setIsLoading(true);
    const uploadedPaths = [];
    let saved = false;
    try {
      if (!user?.id || original.user_id !== user.id || original.owner_status === 'withdrawn') {
        throw new Error('ACTION_NOT_ALLOWED');
      }
      if (!values.faces?.length || values.faces.some(face => !face.images?.front)) {
        throw new Error('FRONT_IMAGE_REQUIRED');
      }
      const faces = [];
      for (const face of values.faces) {
        const images = {};
        for (const view of IMAGE_VIEWS) {
          const image = face.images?.[view];
          const file = image?.file ?? image;
          if (typeof File !== 'undefined' && file instanceof File) {
            const upload = await storageService.uploadPlacementImage(file, user.id);
            images[view] = upload.publicUrl;
            uploadedPaths.push(upload.filePath);
          } else {
            images[view] = typeof image === 'string' ? image : image?.url ?? null;
          }
        }
        if (!images.front) throw new Error('FRONT_IMAGE_REQUIRED');
        faces.push({ ...face, images });
      }
      const result = await placementsService.editPlacement({ ...values, id: original.id, faces });
      saved = true;

      const retainedUrls = new Set(faces.flatMap(face => IMAGE_VIEWS.map(view => face.images[view]).filter(Boolean)));
      const oldPaths = original.faces.flatMap(face => IMAGE_VIEWS.map(view => face.images?.[view]))
        .filter(url => url && !retainedUrls.has(url))
        .map(url => storageService.getPlacementImagePath(url, user.id)).filter(Boolean);
      if (oldPaths.length) {
        try { await storageService.removePlacementImages([...new Set(oldPaths)]); }
        catch (cleanupError) { console.error('Old placement image cleanup failed', cleanupError); }
      }
      return result;
    } catch (error) {
      if (!saved && uploadedPaths.length) {
        try { await storageService.removePlacementImages(uploadedPaths); }
        catch (cleanupError) { console.error('Placement image cleanup failed', cleanupError); }
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  return { edit, isLoading };
};
