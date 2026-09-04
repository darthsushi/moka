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
      latitude={latitude}
      longitude={longitude}
      anchor="bottom"
      onClick={handleClick}
    >
      <button
        type="button"
        aria-label={`Explorar ${placement.code}`}
        title={placement.code}
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
        <span
          className={`
            flex
            size-9
            items-center
            justify-center
            rounded-full
            border-3
            border-background
            shadow-md
            text-xs
            font-semibold
            ${
              isSelected
                ? 'bg-foreground text-background'
                : 'bg-primary text-primary-foreground'
            }
          `}
        >
          M
        </span>

        <span
          className={`
            absolute
            -bottom-1
            size-3
            rotate-45
            border-r-3
            border-b-3
            border-background
            ${
              isSelected
                ? 'bg-foreground'
                : 'bg-primary'
            }
          `}
        />
      </button>
    </Marker>
  );
}

export default PlacementMapMarker;