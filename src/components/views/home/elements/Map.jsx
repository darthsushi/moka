import { useUI } from '@/hooks/contexts';

function Map() {
  const { isMapOpen } = useUI();

  return (
    <div
      data-map
      className={ `transition-all h-screen bg-blue-300 sticky top-20 overflow-hidden ${ isMapOpen ? 'w-[50%]' : 'w-0'}` }
      style={{
        height: 'calc(100% - 80px)'
      }}
    >
      Esto es un mapa
    </div>
  );
}

export default Map;
