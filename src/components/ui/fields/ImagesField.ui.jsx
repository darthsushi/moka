import { useCallback, useEffect, useRef } from 'react';
import { useController } from 'react-hook-form';
import {
  Button,
  Card,
  ErrorMessage,
  Input,
  Label,
  Popover,
  Surface,
  Tooltip,
  Typography
} from '@heroui/react';

import { isEmpty, isNotNil, noop, not } from '@/helpers/ramda.helpers';
import { useLanguage } from '@/hooks/contexts';
import { SYSTEM as SYSTEM_LANGS } from '@/settings/langs.settings';

import Icon from '../icons/Icon.ui';

function ImagesVisualizer({ images = [], removeImage, systemLabels }) {

  return (
    <section
      aria-label='visualizer images'
      className="w-full grid grid-cols-3 gap-1 py-2"
    >
      {
        images.map((image, index) => {
          const isURL = typeof image === 'string';

          if (isURL) {
            return 'image aun no disponible';
          }

          const actualImageURL = URL.createObjectURL(image);

          return (
            <Card
              key={ index }
              className="relative col-span-1 p-1 rounded-4xl"
              variant="tertiary"
            >
              <div
                className="bg-cover bg-center h-28 col-span-1 rounded-3xl"
                style={ { backgroundImage: `url(${actualImageURL})` } }
              />
              <Card.Footer className="grid grid-cols-4 gap-1">
                <Tooltip>
                  <Button
                    fullWidth
                    size="sm"
                    variant="danger-soft"
                    className="col-span-2 text-md"
                    onPress={ () => removeImage(index) }
                  >
                    <Icon name="remove" />
                  </Button>
                  <Tooltip.Content>
                    <p>
                      { systemLabels.TOOLTIPS.REMOVE }
                    </p>
                  </Tooltip.Content>
                </Tooltip>
                <Popover>
                  <Button
                    fullWidth
                    size="sm"
                    variant="secondary"
                    className="col-span-2"
                  >
                    <Icon name="visibility" />
                  </Button>
                  <Popover.Content
                    className="w-2xs max-w-xs"
                  >
                    <Popover.Dialog>
                      <Popover.Arrow />
                      <Popover.Heading>
                        <Typography type="body-xs" className="truncate">
                          { image.name }
                        </Typography>
                      </Popover.Heading>
                      <div className="w-full flex justify-center h-40 mt-2">
                        <img
                          src={ actualImageURL }
                          alt={ image.name }
                          className="w-auto max-h-full"
                        />
                      </div>
                    </Popover.Dialog>
                  </Popover.Content>
                </Popover>
              </Card.Footer>
            </Card>
          );
        })
      }
    </section>
  );
};

function ImagesField({
  label,
  name,
  control,
  defaultValue,
  isDisabled = false,
  maxImages = 5,
  minImages = 0,
  errors = {},
  onChange = noop,
  registerError = noop,
}) {
  const { language } = useLanguage();
  const fileInputRef = useRef(null); 
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
        required: (actualImages) => actualImages.length,
        min: (actualImages) => actualImages.length >= minImages,
        max: (actualImages) => not(actualImages.length > maxImages),
      }
    },
  });

  const SYSTEM_LABELS = SYSTEM_LANGS[language];

  const handleRemoveImage = (indexToRemove) => {
    const remainingImages = field.value
      .filter((_, index) => index !== indexToRemove);
    
    field.onChange(remainingImages);
    onChange(remainingImages);
  };

  const handleOnChange = useCallback(({ target } = {}) => {
    if ((field.value || []).length >= maxImages) {
      console.log('error max images');

      return;
    }

    const inputFileList = [ ...(Array.from(target?.files) || []) ];
    const emptySpacesForMaximum = maxImages - (field.value || []).length;

    const actualFileList = [
      ...field.value,
      ...inputFileList.splice(0, emptySpacesForMaximum)
    ];

    field.onChange(actualFileList);
    onChange(actualFileList);
  }, [field, maxImages, onChange]);

  useEffect(
    () => { registerError(isNotNil(error) ? { ...error, field: error.ref.name } : { field: name, ref: null }) },
    [error, name, registerError]
  );
  return (
    <section
      aria-label="images field"
      className="w-full gap-1 flex flex-col"
    >
      <Label
        className={ invalid && 'text-danger' }
        htmlFor={ `images-field-${name}` }
        >
        { label }
      </Label>
      <Surface className={ `w-full flex flex-col gap-1 p-2 shadow rounded-4xl ${ invalid && ' border border-danger' }` }>
        { not(isEmpty(field.value)) &&
          <ImagesVisualizer
            removeImage = { handleRemoveImage }
            images={ field.value }
            systemLabels={ SYSTEM_LABELS }
          />
        }
        <section
          aria-label='field actions'
          id={ `field-actions-${name}` }
          className="grid grid-cols-6 gap-1"
        >
          <Button
            fullWidth
            variant="outline"
            size="lg"
            className="col-span-6"
            onPress={ () => fileInputRef.current?.click() }
          >
             <Icon name="find-image" />
              { SYSTEM_LABELS.BUTTONS['BROWSE_IMAGES'] }
          </Button>
        </section>
      </Surface>
      { isNotNil(error) &&
          <ErrorMessage>
            { 
              isEmpty(error.message)
                ? (errors[error.type] || error.type)
                : errors[error.message]
            }
          </ErrorMessage>
        }
      <div
        className="hidden"
        aria-label="input file hidden"
      >
        <Input
          multiple
          onChange={ handleOnChange }
          onBlur={ field.onBlur }
          name={ field.name }
          ref={ fileInputRef }
          id={ `images-field-${name}` }
          type="file"
          className="hidden"
          accept="image/*"
        />
      </div>
    </section>
  );
};

export default ImagesField;
