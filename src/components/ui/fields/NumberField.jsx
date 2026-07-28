import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, Label, NumberField } from '@heroui/react';

import { isEmpty, isNotNil, noop } from '../../../helpers/ramda.helpers';
import Icon from '../../icons';

function NumberInputField({
  control,
  defaultValue,
  label,
  max,
  maxLength,
  min,
  minLength,
  name,
  placeholder,
  autoFocus = false,
  isRequired = false,
  isDisabled = false,
  isReadOnly = false,
  errors = {},
  formatOptions = {},
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
    <>
      <NumberField
        fullWidth
        locales="es-MX"
        name={ field.name }
        inputRef={ field.ref }
        value={ field.value }
        onBlur={ field.onBlur }
        isInvalid={ invalid }
        minValue={ min }
        maxValue={ max }
        isReadOnly={ isReadOnly }
        formatOptions={ formatOptions }
        autoFocus={ autoFocus }
        isDisabled={ isDisabled }
        onChange={ handleOnChange }
        placeholder={ placeholder }
      >
        <Label>
          { label }
        </Label>
        <NumberField.Group className="flex">
          <NumberField.Input className="flex-1" />
          <div className="flex h-full flex-col border-l border-field-placeholder/15">
            <NumberField.IncrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pt-0.5 text-sm">
              <Icon name="arrow-drop-up" />
            </NumberField.IncrementButton>
            <NumberField.DecrementButton className="flex h-1/2 w-6 items-center justify-center rounded-none border-0 pb-0.5 text-sm">
              <Icon name="arrow-drop-down" />
            </NumberField.DecrementButton>
          </div>
        </NumberField.Group>
        { isNotNil(error) &&
          <FieldError>
            { 
              isEmpty(error.message)
                ? (errors[error.type] || error.type)
                : errors[error.message]
            }
          </FieldError>
        }
      </NumberField>
    </>
  );
};

export default NumberInputField;
