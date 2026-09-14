import { Marker } from 'react-map-gl/mapbox';

function PlacementMapMarker({
  placement,
  isSelected = false,
  onClick
}) {
  const latitude = Number(placement.latitude);
  const longitude = Number(placement.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const handleClick = (event) => {
    event.originalEvent.stopPropagation();

    onClick?.(placement);
  };

  return (
    <Marker
      latitude={ latitude }
      longitude={ longitude }
      anchor="bottom"
      onClick={ handleClick }
    >
      <button
        type="button"
        aria-label={ `Explorar ${placement.code}` }
        title={ placement.code }
        className={`
          group
          relative
          flex
          items-center
          justify-center
          cursor-pointer
          transition-transform
          duration-200
          hover:scale-110
          ${isSelected ? 'scale-110' : ''}
        `}
      >
        <span className={ `flex size-8 p-0.5 rounded-full shadow-2xl ${isSelected ? 'bg-accent border-2 border-accent' : 'bg-default border border-default'}` }>
          <span className={ `relative w-full h-full rounded-full z-2 ${isSelected ? 'bg-default' : 'bg-accent'}` }>
            <img src='./assets/moka/logo.png' className="w-full h-full object-contain" />
          </span>
        </span>
        <span
          className={`
            absolute
            -bottom-1
            size-3
            rotate-45
            border-r-3
            border-b-3
            ${
              isSelected
                ? 'bg-accent border-accent'
                : 'bg-default border-default'
            }
          `}
        />
      </button>
    </Marker>
  );
}

export default PlacementMapMarker;