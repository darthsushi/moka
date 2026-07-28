import { not } from './ramda.helpers';

function isFunction(toEvaluate) {
  return typeof toEvaluate === 'function'
}

const isPositiveNumber = (actualValue) => {
  const value = parseFloat(actualValue);

  if (not(isNaN(value)) && value > 0) {
    return true;
  }
  
  return false;
};

const isValidCoodinates = (actualCoordinates) => {
  if (typeof actualCoordinates !== 'string') return false;

  const match = actualCoordinates.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);

  if (not(match)) return false;

  const lat = Number(match[1]);
  const lng = Number(match[3]);

  return (
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const isValidHeight = (value) => {
  const regex = /^\d+(\.\d{1,2})?$/;

  if (not(regex.test(value))) {
    return false;
  }

  const height = Number(value);

  return height >= 0.5 && height <= 100;
};

export {
  isFunction,
  isPositiveNumber,
  isValidCoodinates,
  isValidHeight,
};
