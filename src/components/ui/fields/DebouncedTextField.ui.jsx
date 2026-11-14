import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { fieldError } from '@/i18n/errors';
import { FieldError, Label, TextField, Input } from '@heroui/react';

import { isNotNil, noop } from '@/helpers/ramda.helpers';

function DebouncedTextField({
  control,
  defaultValue,
  label,
  max,
  maxLength,
  min,
  minLength,
  name,
  placeholder,
  type = 'text',
  autoFocus = false,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  errors = {},
  debounceMs = 1000,
  onChange = noop,
  registerError = noop,
  validate = () => true,
}) {
  const { t } = useTranslation();
  const timerRef = useRef(null);
  const pendingValueRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const {
    field,
    fieldState: { invalid, error },
  } = useController({
    name,
    control,
    defaultValue,
    disabled: isDisabled,
    rules: {
      required: isRequired,
      max,
      min,
      maxLength,
      minLength,
      validate,
    },
  });

  // Keep the latest callback without restarting the timer on parent renders.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Cancel pending work on unmount or when the field configuration changes.
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingValueRef.current = null;
  }, [control, name, isDisabled, isReadOnly, debounceMs]);

  // An external value change (reset/setValue) must not emit an outdated value.
  useEffect(() => {
    if (timerRef.current !== null && field.value !== pendingValueRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      pendingValueRef.current = null;
    }
  }, [field.value]);

  const handleOnChange = (actualValue) => {
    if (isDisabled || isReadOnly) return;

    // RHF stays current for validation, watch and submission; only the prop waits.
    field.onChange(actualValue);
    clearTimeout(timerRef.current);
    pendingValueRef.current = actualValue;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      pendingValueRef.current = null;
      onChangeRef.current(actualValue);
    }, debounceMs);
  };

  useEffect(
    () => { registerError(isNotNil(error) ? { ...error, field: error.ref?.name } : { field: name, ref: null }) },
    [error, name, registerError]
  );

  return (
    <TextField
      fullWidth
      onChange={ handleOnChange }
      onBlur={ field.onBlur }
      value={ field.value ?? '' }
      name={ field.name }
      inputRef={ field.ref }
      isInvalid={ invalid }
      placeholder={ placeholder || '' }
      isDisabled={ isDisabled }
      type={ type }
      isReadOnly={ isReadOnly }
      autoFocus={ autoFocus }
      maxLength={ maxLength }
      minLength={ minLength }
      max={ max }
      min={ min }
    >
      <Label>
        { label }
      </Label>
      <Input
        placeholder={ placeholder || '' }
        maxLength={ maxLength }
        minLength={ minLength }
        max={ max }
        min={ min }
        variant="secondary"
      />
      { isNotNil(error) &&
        <FieldError>
          { fieldError(t, error, errors, { min, max, minLength, maxLength }) }
        </FieldError>
      }
    </TextField>
  );
}

export default DebouncedTextField;
