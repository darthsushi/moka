import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPlacementCoordinates,
  normalizeFaceImages,
  parsePlacementCoordinates,
  placementImageList
} from '../src/helpers/placement.helpers.js';

test('coordinates validate input and preserve latitude/longitude ordering at the database boundary', () => {
  assert.deepEqual(parsePlacementCoordinates('20.97275,-89.6408'), { latitude: 20.97275, longitude: -89.6408 });
  for (const invalid of ['20.97', '20,', '91,0', '0,0', 'NaN,10', '20,10,1']) {
    assert.throws(() => parsePlacementCoordinates(invalid), /INVALID_COORDINATES/);
  }
  assert.deepEqual(getPlacementCoordinates({ coordinates: '20,-89' }), { latitude: 20, longitude: -89 });
  assert.equal(getPlacementCoordinates({}), null);
});

test('named face images preserve the front view and nullable optional views', () => {
  const images = normalizeFaceImages([
    { view_type: 'surrounding', url: 'context.webp' },
    { view_type: 'front', url: 'front.webp' }
  ]);
  assert.deepEqual(images, { front: 'front.webp', approach: null, surrounding: 'context.webp' });
  assert.deepEqual(placementImageList(images), ['front.webp', 'context.webp']);
});
