export const IMAGE_VIEWS = ['front', 'approach', 'surrounding'];

export const parsePlacementCoordinates = (coordinates) => {
  if (typeof coordinates !== 'string') throw new Error('INVALID_COORDINATES');
  const parts = coordinates.split(',').map(part => part.trim());
  if (parts.length !== 2 || parts.some(part => part === '')) throw new Error('INVALID_COORDINATES');
  const [latitude, longitude] = parts.map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
    || (latitude === 0 && longitude === 0)) throw new Error('INVALID_COORDINATES');
  return { latitude, longitude };
};

export const placementImageList = images => IMAGE_VIEWS
  .map(view => images?.[view])
  .filter(Boolean);

export const getPlacementCoordinates = placement => {
  try { return parsePlacementCoordinates(placement?.coordinates); }
  catch { return null; }
};

export const normalizeFaceImages = images => {
  if (images && !Array.isArray(images)) return images;
  return (images ?? []).reduce((result, image) => {
    if (IMAGE_VIEWS.includes(image.view_type)) result[image.view_type] = image.url;
    return result;
  }, { front: null, approach: null, surrounding: null });
};
