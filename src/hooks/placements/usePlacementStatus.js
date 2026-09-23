import { useState } from 'react';

import { placementsService } from '@/services/placements.service';

export const usePlacementStatus = (onSuccess) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const save = async (placementId, operation) => {
    setUpdatingId(placementId);
    setError(null);

    try {
      await operation();
      await onSuccess();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el espacio.');
    } finally {
      setUpdatingId(null);
    }
  };

  const changeOwnerStatuses = async (placementIds, status) => {
    setUpdatingId('batch');
    setError(null);

    const failures = [];
    let updated = 0;

    try {
      for (const placementId of placementIds) {
        try {
          await placementsService.updatePlacementOwnerStatus(placementId, status);
          updated += 1;
        } catch (err) {
          failures.push(err);
        }
      }

      if (updated > 0) await onSuccess();

      if (failures.length > 0) {
        setError(`${updated} actualizados; ${failures.length} no se pudieron actualizar. ${failures[0]?.message || ''}`);
      }
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el inventario.');
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    updatingId,
    error,
    clearError: () => setError(null),
    changeOwnerStatus: (placementId, status) => save(
      placementId,
      () => placementsService.updatePlacementOwnerStatus(placementId, status)
    ),
    changeOwnerStatuses,
    restorePlacement: (placementId) => save(
      placementId,
      () => placementsService.restorePlacement(placementId)
    ),
    changeReviewStatus: (placementId, status) => save(
      placementId,
      () => placementsService.updatePlacementReviewStatus(placementId, status)
    )
  };
};
