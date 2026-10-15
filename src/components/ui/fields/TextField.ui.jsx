import { useTranslation } from 'react-i18next';
import { fieldError } from '@/i18n/errors';
import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, Label, TextField, Input } from '@heroui/react';

import { isNotNil, noop } from '@/helpers/ramda.helpers';

function InputField({
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
  onChange = noop,
  registerError = noop,
  validate = () => true,
}) {
  const { t } = useTranslation();
  const {
    field,
    fieldState: { invalid, error },
  } = useController({
    name,
    control,
    defaultValue,
    rules: {
      required: isRequired,
      disabled: isDisabled,
      max,
      min,
      maxLength,
      minLength,
      validate,
    },
  });

  const handleOnChange = (actualValue) => {
    field.onChange(actualValue);
    onChange(actualValue);
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
      />
      { isNotNil(error) &&
        <FieldError>
          {
            fieldError(t, error, errors, { min, max, minLength, maxLength })
          }
        </FieldError>
      }
    </TextField>
  );
};

export default InputField;
