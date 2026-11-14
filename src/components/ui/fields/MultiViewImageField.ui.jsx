import { fieldError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useController } from 'react-hook-form';
import {
  Button,
  Input,
  Label
} from '@heroui/react';

import { isNil, isNotNil, noop } from '@/helpers/ramda.helpers';

import Icon from '../icons/Icon.ui';
import FlatCard from '../containers/FlatCard.ui';
import { useState } from 'react';

const getImageURL = (image) => {
  if (typeof image === 'string') return image;

  if (image instanceof File) return URL.createObjectURL(image);

  return null;
};

function InputImage({ id, label, defaultValue, onChange }) {
  const fileInputRef = useRef(null);
  const [actualImage, setActualImage] = useState(() => {
    if (isNil(defaultValue)) return null;

    return getImageURL(defaultValue);
  });

  const handleOnChange = ({ target } = {}) => {
    const image = target.files[0];

    setActualImage(URL.createObjectURL(image));
    onChange({ [id]: image });
  };

  const removeImage = () => {
    setActualImage(null);
    onChange({ [id]: null });
  }

  return (
    <div id={ id } className="flex flex-col items-center">
      <button
        aria-label={ `button input ${label || id}` }
        id={ `button-upload-${id}` }
        className="w-37 h-37 flex-none cursor-pointer rounded-4xl bg-cover bg-center bg-no-repeat bg-surface-tertiary p-3"
        onClick={ (e) => { e.preventDefault(); fileInputRef.current?.click(); } }
        style={ { backgroundImage: `url(${actualImage})` } }
      >
        { isNil(actualImage) &&
          <div className="w-full text-3xl text-accent-soft h-full flex justify-center items-center border-3 border-dashed border-accent-soft rounded-3xl">
            <Icon name="add" />
          </div>
        }
      </button>
      <div className="w-full p-1 flex gap-2 justify-center items-center">
        { isNotNil(actualImage) &&
          <Button
            isIconOnly
            onPress={ removeImage }
            variant="danger-soft"
            size="sm"
          >
            <Icon name="delete" />
          </Button>
        }
         <Label>
          { label }
        </Label>
      </div>
      <div
        className="hidden"
        aria-hidden
      >
        <Input
          aria-label={ `input image ${id}` }
          onChange={ handleOnChange }
          name={ id }
          ref={ fileInputRef }
          id={ `images-field-${id}` }
          type="file"
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
}

function MultiViewImageField({
  label,
  name,
  control,
  defaultValue,
  className,
  isDisabled = false,
  ids = [],
  errors = {},
  onChange = noop,
  registerError = noop,
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
      disabled: isDisabled,
      validate: {
        required: (actualImages = {}) => ids.every(({ id, required }) => !required || actualImages[id] != null),
      }
    },
  });

  const onInputChange = (viewUpdate) => {
    onChange({ ...(field.value || {}), ...viewUpdate })
    field.onChange({ ...(field.value || {}), ...viewUpdate });
  };

  useEffect(
    () => { registerError(isNotNil(error) ? { ...error, field: error.ref?.name } : { field: name, ref: null }) },
    [error, name, registerError]
  );

  return (
    <section
      aria-label={ t('common:a11y.images') }
      className="w-full"
    >
      <Label
        className={ invalid && 'text-danger' }
        htmlFor={ `images-field-${name}` }
        >
        { label }
      </Label>
      <FlatCard
        variant="transparent"
        className={ `w-full flex flex-wrap gap-3 ${className} ${ invalid && ' border border-danger' }` }>
          { ids.map(({ id, label }) => {
              return (
              <InputImage
                key={ id }
                onChange={ onInputChange }
                defaultValue={ (field.value || {})[id] || null }
                id={ id }
                label={ label }
              />)
            })
          }
      </FlatCard>
      { isNotNil(error) &&
        <p role="alert" className="text-xs text-danger">
          { fieldError(t, error, errors) }
        </p>
      }
    </section>
  );
};

export default MultiViewImageField;
