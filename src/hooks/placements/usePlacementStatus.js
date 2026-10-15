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
      setError(err);
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
        setError({ code: 'BULK_UPDATE_FAILED', updated, failed: failures.length });
      }
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    updatingId,
    error,
    changeOwnerStatus: (placementId, status) => save(
      placementId,
      () => placementsService.updatePlacementOwnerStatus(placementId, status)
    ),
    changeOwnerStatuses,
    changeReviewStatus: (placementId, status) => save(
      placementId,
      () => placementsService.updatePlacementReviewStatus(placementId, status)
    )
  };
};
