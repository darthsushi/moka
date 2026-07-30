import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, InputGroup, Label, TextField } from '@heroui/react';

import { isEmpty, isNotNil, noop } from '@/helpers/ramda.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

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
  const { language } = useLanguage();
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

  const SYSTEM_LABELS = SYSTEM_LANGS[language];

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
      value={ field.value }
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
          { SYSTEM_LABELS.WORDS.METERS }
        </InputGroup.Suffix>
      </InputGroup>
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

export default MetersField;
