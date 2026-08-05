import { find, isNil, isNotNil, not } from './ramda.helpers';

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

const getRequiredParams = (requiredParamIds = [], paramValues = {}) => {
  return Array.isArray(requiredParamIds)
      ? requiredParamIds.map(paramId => paramValues[paramId].value)
      : [];
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
  canUseParameters,
  canAccessModule,
  classNameParser,
  getGreeting,
  getPriorityProperty,
  getRequiredParams,
  getUnlistedPlacementUrl,
  parseDayRange,
  serializeDayRange
};