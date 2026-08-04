import { find, isNil, isNotNil, not } from './ramda.helpers';

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

const getPriorityProperty = (actualObject = {}, priorityKeys) => {
  const winningKey = find((key) => not(isNil(actualObject[key])))(priorityKeys)

  return winningKey 
    ? { prop: winningKey, value: actualObject[winningKey] } 
    : null;
}; 

const getRequiredParams = (requiredParamIds = [], paramValues = {}) => {
  return Array.isArray(requiredParamIds)
      ? requiredParamIds.map(paramId => paramValues[paramId].value)
      : [];
};

const canAccessModule = (module, isAuthenticated, roles = []) => {
  if (module.requiresAuth && not(isAuthenticated)) return false;
  if (not(module.roles?.length)) return true;

  return module.roles.some(role => roles.includes(role));
};

export {
  canUseParameters,
  canAccessModule,
  classNameParser,
  getPriorityProperty,
  getRequiredParams
};