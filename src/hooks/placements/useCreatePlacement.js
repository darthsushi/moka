import { useState } from 'react';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { storageService } from '@/services/storage.service';
import { placementsService } from '@/services/placements.service';
import { IMAGE_VIEWS, parsePlacementCoordinates } from '@/helpers/placement.helpers';

export const useCreatePlacement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, profile } = useAuth();

  const create = async ({
    type,
    faces,
    description,
    coordinates,
    structure_height,
    location,
    visibility
  }) => {
    setIsLoading(true);
    setError(null);
    const uploadedPaths = [];

    // TODO: Use hasRole or hasAnyRole
    const isOwner = (profile?.roles || []).includes('owner');

    try {
      if (not(user?.id) || not(isOwner)) {
        const ERROR_LABEL = 'ACTION_NOT_ALLOWED';
        const authError = new Error(ERROR_LABEL);
        authError.label = ERROR_LABEL;

        throw authError;
      };

      parsePlacementCoordinates(coordinates);
      if (!Array.isArray(faces) || !faces.length || faces.some(face => !face.images?.front)) {
        throw new Error('FRONT_IMAGE_REQUIRED');
      }

      const actualPlacement = {
        type,
        description,
        coordinates,
        location,
        structure_height,
        visibility,
      };

      const uploadedFaces = [];
      for (const face of faces) {
        const images = { front: null, approach: null, surrounding: null };
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
        uploadedFaces.push({ ...face, images });
      }

      const placementData = await placementsService.createPlacement({ ...actualPlacement, faces: uploadedFaces });
      setIsLoading(false);
      return placementData;

    } catch (err) {
      if (uploadedPaths.length) {
        try { await storageService.removePlacementImages(uploadedPaths); }
        catch (cleanupError) { console.error('Placement image cleanup failed', cleanupError); }
      }
      setError(err);
      setIsLoading(false);
      throw err;
    }
  };

  return { create, isLoading, error };
};
