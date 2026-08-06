import { useEffect } from 'react';
import { not } from '@/helpers/ramda.helpers';

export function useEscapeKey(onEscape, isActive = true) {
  useEffect(() => {
    if (not(isActive)) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, isActive]);
}
