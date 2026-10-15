import { fieldError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useController } from 'react-hook-form';
import { FieldError, Label, ListBox, Select } from '@heroui/react';

import { isNotNil, noop } from '@/helpers/ramda.helpers';

function SelectField({
  control,
  defaultValue,
  label,
  name,
  placeholder,
  autoFocus = false,
  isRequired = false,
  isDisabled = false,
  errors = {},
  options = [],
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
      validate
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
    <Select
      fullWidth
      onChange={ handleOnChange }
      onBlur={ field.onBlur }
      value={ field.value }
      name={ field.name }
      inputRef={ field.ref }
      isInvalid={ invalid }
      placeholder={ placeholder || t('common:defaults.selectOne') }
      isDisabled={ isDisabled }
      autoFocus={ autoFocus }
    >
      <Label>
        { label }
      </Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {
            options.map((option, index) => {
              return (
                <ListBox.Item
                  key={ index }
                  id={ option.id || option }
                  textValue={ option.label  || option }
                >
                  { option.label  || option }
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )
            })
          }
        </ListBox>
      </Select.Popover>
      { isNotNil(error) &&
        <FieldError>
          {
            fieldError(t, error, errors)
          }
        </FieldError>
      }
    </Select>
  );
};

export default SelectField;
