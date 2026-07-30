import { useUI } from '@/hooks/contexts';

function Map() {
  const { isMapOpen } = useUI();

  return (
    <div
      aria-label="map"
      className={ `transition-all max-h-full bg-blue-300 sticky top-0 overflow-hidden ${ isMapOpen ? 'w-[50%]' : 'w-0'}` }
    >

    </div>
  );
}

export default Map;
