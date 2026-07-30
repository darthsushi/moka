import { useState, useCallback } from 'react';
import { placementsService } from '@/services/placements.service';

export const usePublicPlacements = () => {
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await placementsService.getPublicPlacements();
      setPlacements(data);
    } catch (err) {
      console.error("Error cargando placements:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  return { 
    placements, 
    isLoading, 
    error, 
    refetch: fetchPlacements // Lo exportamos por si quieres poner un botón de "Actualizar"
  };
};