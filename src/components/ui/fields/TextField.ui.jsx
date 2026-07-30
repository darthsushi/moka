import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, Label, TextField, Input } from '@heroui/react';

import { isEmpty, isNotNil, noop } from '@/helpers/ramda.helpers';

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
      value={ field.value }
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
            isEmpty(error.message)
              ? (errors[error.type] || error.type)
              : errors[error.message]
          }
        </FieldError>
      }
    </TextField>
  );
};

export default InputField;
