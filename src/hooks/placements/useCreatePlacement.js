import { useState } from 'react';

import { not } from '@/helpers/ramda.helpers';
import { useAuth } from '@/hooks/contexts';
import { storageService } from '@/services/storage.service';
import { placementsService } from '@/services/placements.service';

export const useCreatePlacement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, profile } = useAuth();

  const create = async ({
    type,
    faces,
    description,
    latitude,
    longitude,
    structure_height,
    location
  }) => {
    setIsLoading(true);
    setError(null);

    // TODO: Use hasRole or hasAnyRole
    const isOwner = (profile.roles || []).includes('owner');

    try {
      if (not(user?.id) || not(isOwner)) {
        const ERROR_LABEL = 'ACTION_NOT_ALLOWED';
        const authError = new Error(ERROR_LABEL);
        authError.label = ERROR_LABEL;

        throw authError;
      };

      const actualPlacement = {
        type,
        faces,
        description,
        latitude,
        longitude,
        location,
        structure_height,
        status: 'pending',
        visibility: 'public'
      };

      await Promise.all(
        actualPlacement.faces.map(async (face) => {
          face.images = await Promise.all(
            face.images.map(async (img) => {
              const fileToUpload = img?.file ?? img;

              if (fileToUpload instanceof File) {
                return storageService.uploadPlacementImage(
                  fileToUpload,
                  user.id
                );
              }

              return typeof img === 'object' && img !== null
                ? img.url
                : img;
            })
          );
        })
      );

      const placementData = await placementsService.createPlacement(actualPlacement, user.id);
      setIsLoading(false);

      return {
        ...placementData.placement,
        faces: placementData.faces
      };

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  return { create, isLoading, error };
};
