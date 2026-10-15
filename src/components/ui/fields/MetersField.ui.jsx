import { fieldError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, InputGroup, Label, TextField } from '@heroui/react';

import { isNotNil, noop } from '@/helpers/ramda.helpers';

function MetersField({
  label,
  name,
  control,
  placeholder,
  defaultValue,
  isReadOnly,
  autoFocus,
  max,
  min,
  isRequired = false,
  isDisabled = false,
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
      validate
    },
  });

  const handleOnChange = (actualValue) => {
    field.onChange(actualValue);
    onChange(actualValue, field.name);
  };

  useEffect(
    () => { registerError(isNotNil(error) ? { ...error, field: error.ref.name } : { field: name, ref: null }) },
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
      isReadOnly={ isReadOnly }
      autoFocus={ autoFocus }
    >
      <Label>
        { label }
      </Label>
      <InputGroup>
        <InputGroup.Input
          type="number"
          className="w-[50%]"
          max={ max }
          min={ min }
        />
        <InputGroup.Suffix>
          { t('common:words.meters') }
        </InputGroup.Suffix>
      </InputGroup>
      { isNotNil(error) &&
        <FieldError>
          {
            fieldError(t, error, errors, { min, max })
          }
        </FieldError>
      }
    </TextField>
  );
};

export default MetersField;
