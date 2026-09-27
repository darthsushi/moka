import { find, isNil, isNotNil, not } from './ramda.helpers';

const applyListFilter = (query, column, value) => {
  const values = value instanceof Set
    ? [...value]
    : Array.isArray(value)
      ? value
      : [value];

  const normalizedValues = [...new Set(
    values
      .map(item => typeof item === 'string' ? item.trim() : item)
      .filter(item => (
        item !== null &&
        item !== undefined &&
        item !== '' &&
        item !== 'all'
      ))
  )];

  if (normalizedValues.length === 1) {
    return query.eq(column, normalizedValues[0]);
  }

  if (normalizedValues.length > 1) {
    return query.in(column, normalizedValues);
  }

  return query;
};

const canAccessModule = (module, isAuthenticated, roles = []) => {
  if (module.requiresAuth && not(isAuthenticated)) return false;
  if (not(module.roles?.length)) return true;

  return module.roles.some(role => roles.includes(role));
};

const canUseParameters = (requiredParamIds, paramValues) => {
  if (isNil(requiredParamIds)) {
    return true;
  }

  return requiredParamIds.every((id) => {
    return (id in paramValues) && isNotNil(paramValues[id].value);
  });
};

const classNameParser = (classNameArray = []) => {
  return classNameArray.join(' ')
};

const equalsIgnoreOrderNative = (a, b) => {
  if (a.length !== b.length) return false;
  
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  
  return sortedA.every((val, index) => val === sortedB[index]);
};

const formatCurrency = (value, currency = 'MXN') => {
  const locales = {
    MXN: 'es-MX',
    USD: 'en-US',
  };

  if (!locales[currency]) {
    throw new Error(`Moneda no soportada: ${currency}`);
  }

  return new Intl.NumberFormat(locales[currency], {
    style: 'currency',
    currency,
    currencyDisplay: 'code'
  }).format(value);
};

const getGreeting = (hour = new Date().getHours()) => {
  if (hour < 6 || hour >= 20) return 'GOOD_NIGHT';
  if (hour < 12) return 'GOOD_MORNING';
  return 'GOOD_AFTERNOON';
};

const getPriorityProperty = (actualObject = {}, priorityKeys) => {
  const winningKey = find((key) => not(isNil(actualObject[key])))(priorityKeys)

  return winningKey 
    ? { prop: winningKey, value: actualObject[winningKey] } 
    : null;
};

const getUnlistedPlacementUrl = (placement) => {
  if ( placement.visibility !== 'unlisted' || !placement.share_token ) {
    return null;
  }

  return `${window.location.origin}/p/${placement.id}/${placement.share_token}`;
}

const getPlacementDetailsPath = (placement) => {
  if (placement.visibility === 'unlisted' && placement.share_token) {
    return `/p/${placement.id}/${placement.share_token}`;
  }

  return `/p/${encodeURIComponent(placement.code)}`;
};

const getValueOrDefault = (value, options = [], defaultValue = null) => {
  return options.includes(value) ? value : defaultValue;
};

const getRequiredParams = (requiredParamIds = [], paramValues = {}) => {
  return Array.isArray(requiredParamIds)
      ? requiredParamIds.map(paramId => paramValues[paramId].value)
      : [];
};

const normalizeFaceCount = (faceCount) => {
  if (faceCount === null || faceCount === undefined || faceCount === '') {
    return null;
  }

  const normalizedFaceCount = Number(faceCount);

  if (!Number.isInteger(normalizedFaceCount) || normalizedFaceCount < 0) {
    throw new Error('INVALID_FACE_COUNT_FILTER');
  }

  return normalizedFaceCount;
};

const normalizeFaceCounts = (faceCount) => {
  const values = faceCount instanceof Set
    ? [...faceCount]
    : Array.isArray(faceCount)
      ? faceCount
      : [faceCount];

  const normalizedValues = values
    .filter(value => (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      value !== 'all'
    ))
    .map(Number);

  if (normalizedValues.some(value => (
    !Number.isInteger(value) || value < 0
  ))) {
    throw new Error('INVALID_FACE_COUNT_FILTER');
  }

  return [...new Set(normalizedValues)];
};

const parseDayRange = (range) => {
  const match = range?.match(/^\[(\d+),(\d+)\)$/);

  if (!match) {
    return null;
  }

  const [, min, exclusiveMax] = match;

  return [
    Number(min),
    Number(exclusiveMax) - 1
  ];
};

const serializeDayRange = ([min, max]) => {
  return `[${min},${max + 1})`;
}

export {
  applyListFilter,
  canUseParameters,
  canAccessModule,
  classNameParser,
  equalsIgnoreOrderNative,
  formatCurrency,
  getGreeting,
  getPriorityProperty,
  getRequiredParams,
  getUnlistedPlacementUrl,
  getPlacementDetailsPath,
  getValueOrDefault,
  normalizeFaceCount,
  normalizeFaceCounts,
  parseDayRange,
  serializeDayRange
};
