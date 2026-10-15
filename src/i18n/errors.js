// Errors are kept as codes/data in state and translated at render time.
// Unknown backend messages are replaced with a localized, user-facing fallback.
export const translateError = (t, error, fallback = 'common:errors.unexpected') => {
  const message = typeof error === 'string' ? error : error?.message;
  const code = message?.match(/\bREVIEW_[A-Z_]+\b/)?.[0]
    || (typeof error === 'object' && (error?.label || error?.code))
    || message?.match(/^[A-Z][A-Z_]{2,}$/)?.[0];
  const candidates = [code?.startsWith('REVIEW_') ? `reviewHub:errors.${code}` : `common:errors.${code}`, fallback];
  return t(candidates, typeof error === 'object' ? { ...error } : {});
};

export const fieldError = (t, error, overrides = {}, limits = {}) => {
  if (!error) return '';
  return overrides[error.message] || overrides[error.type] || t([
    `validation:${error.message || error.type}`, 'validation:invalid',
  ], { min: limits.minLength ?? limits.min, max: limits.maxLength ?? limits.max });
};
