import { useEffect, useState } from 'react';

import { placementsService } from '@/services/placements.service';

const EMPTY_OPTIONS = {
  countries: [],
  states: [],
  cities: [],
  types: []
};

export const usePublicPlacementFilterOptions = () => {
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    placementsService.getPublicPlacementFilterOptions()
      .then(result => {
        if (active) setOptions(result);
      })
      .catch(err => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  return { options, isLoading, error };
};
