import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Fieldset,
  FieldGroup,
  Form,
  Surface,
  Tabs,
  Typography,
} from '@heroui/react';

import { isNil } from '@/helpers/ramda.helpers';
import { isPositiveNumber, isValidHeight } from '@/helpers/validators.helper';

import { ImageField, MetersField, NumberField, RangeField } from '@/components/ui';

const normalizeFaces = (actualFaces, actualValues) => {
  const newFaceArray = [];

  actualFaces.forEach((_, index) => {
    newFaceArray[index] = {
      day_range: actualValues[`day_range_face_${index + 1}`],
      display_height: actualValues[`display_height_face_${index + 1}`],
      display_width: actualValues[`display_width_face_${index + 1}`],
      images: actualValues[`images_face_${index + 1}`],
      period_price: actualValues[`period_price_face_${index + 1}`]
    }
  });

  return newFaceArray;
};

const buildStepObjects = (actualPlacement) => {
  const isFacesNumberSync = isNil(actualPlacement.faces) ? true
    : actualPlacement.faces.length === actualPlacement.faces_number;

  const faceByFormSelector = Array.from({ length: actualPlacement.faces_number || 1 }, () => ({}));
  const actualFaces = isFacesNumberSync ? (actualPlacement.faces || faceByFormSelector) : faceByFormSelector;

  const actualFields = actualFaces.reduce((acc, item, index) => {
    acc[`display_width_face_${index + 1}`] = item.display_width;
    acc[`display_height_face_${index + 1}`] = item.display_height;
    acc[`period_price_face_${index + 1}`] = item.period_price;
    acc[`day_range_face_${index + 1}`] = item.day_range || [30, 90];
    acc[`images_face_${index + 1}`] = item.images || [];

    return acc;
  }, {});

  return { defaultValues: actualFields, faces: actualFaces };
};

function FacesDataStep({ placement, formLabels, systemLabels, previousStep, nextStep }) {
  const [tabSelected, setTabSelected] = useState('face_1');
  
  const { defaultValues, faces } = buildStepObjects(placement);
  const { handleSubmit, control } = useForm({ defaultValues });

  const normalizeBeforeNextStep = (actualValues) => {
    nextStep({ faces:  normalizeFaces(faces, actualValues) });
  };

  return (
    <Form
      id="sizes-form"
      aria-label="sizes-form"
      className="w-full"
      onSubmit={ handleSubmit(normalizeBeforeNextStep) }
    >
      <Fieldset className="w-full">
        <FieldGroup className="w-full px-2">
          <Tabs
            selectedKey={ tabSelected }
            onSelectionChange={ setTabSelected }
            orientation="vertical"
            className="w-full"
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="vertical tabs faces"
                className="rounded-4xl sticky top-1 bg-surface-secondary"
              >
                {
                  faces.map((_, face_index) => {
                    
                    return (
                      <Tabs.Tab
                        className="text-xs"
                        key={ `face_${face_index + 1}` }
                        id={ `face_${face_index + 1}` }
                      >
                        { formLabels.TABS[`FACE_${face_index + 1}`] }
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    );
                  })
                }
              </Tabs.List>
            </Tabs.ListContainer>
            {
              faces.map((_, face_index) => {

                return (
                  <Tabs.Panel
                    key={ `face_${face_index + 1}` }
                    id={ `face_${face_index + 1}` }
                    className={ `w-full flex flex-col gap-2 ${ tabSelected !== `face_${face_index + 1}` && 'hidden' }` }
                    shouldForceMount={ true }
                  >
                    <div className="w-full py-2 flex flex-col gap-2">
                      <div className="px-1">
                        <Typography.Heading level={ 6 }>
                          { formLabels.IMAGES }
                        </Typography.Heading>
                        <Typography.Paragraph
                          color="muted"
                          size="xs"
                          className="leading-3"
                        >
                          { formLabels.IMAGES_DESCRIPTION }
                        </Typography.Paragraph>
                      </div>
                      <Surface
                        variant="secondary"
                        className="w-full p-3 rounded-4xl"
                      >
                        <ImageField
                          name={ `images_face_${face_index + 1}` }
                          control={ control }
                          minImages={ 1 }
                          maxImages={ 3 }
                          errors={{
                            'required': systemLabels.ERRORS.EMPTY_FIELD,
                            'min': systemLabels.ERRORS.EMPTY_FIELD,
                            'max': systemLabels.ERRORS.MAX_ALLOWED_ITEMS,
                          }}
                        />
                      </Surface>
                    </div>
                    <div className="w-full py-2 flex flex-col gap-2">
                      <div className="px-1">
                        <Typography.Heading level={ 6 }>
                          { formLabels.DISPLAY_SIZES }
                        </Typography.Heading>
                      </div>
                      <Surface
                        variant="secondary"
                        className="w-full grid grid-cols-4 gap-2 p-3 rounded-4xl"
                      >
                        <div className="col-span-2">
                          <MetersField
                            label={ formLabels.DISPLAY_WIDTH }
                            name={ `display_width_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': systemLabels.ERRORS.EMPTY_FIELD,
                              'validate': systemLabels.ERRORS.INVALID_VALUE
                            }}
                            placeholder={ formLabels.INPUT_METERS_PLACEHOLDER }
                            validate={ isValidHeight }
                          />
                        </div>
                        <div className="col-span-2">
                          <MetersField
                            label={ formLabels.DISPLAY_HEIGHT }
                            name={ `display_height_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': systemLabels.ERRORS.EMPTY_FIELD,
                              'validate': systemLabels.ERRORS.INVALID_VALUE
                            }}
                            placeholder={ formLabels.INPUT_METERS_PLACEHOLDER }
                            validate={ isValidHeight }
                          />
                        </div>
                      </Surface>
                    </div>
                    <div className="w-full py-2 flex flex-col gap-2">
                      <div className="px-1">
                        <Typography.Heading level={ 6 }>
                          { formLabels.RENTAL_PERIOD }
                        </Typography.Heading>
                      </div>
                      <Surface
                        variant="secondary"
                        className="w-full grid grid-cols-4 gap-2 p-3 rounded-4xl"
                      >
                        <div className="col-span-4">
                          <RangeField
                            label={ formLabels.RANGE_DAYS }
                            name={ `day_range_face_${face_index + 1}` }
                            maxValue={ 365 }
                            minValue={ 15 }
                            step={ 15 }
                            control={ control }
                            defaultValue={ [30,90] }
                            formatOptions={{
                              style: 'unit',
                              unit: 'day',
                              unitDisplay: 'long'
                            }}
                          />
                        </div>
                        <div className="col-span-4">
                          <NumberField
                            label={ formLabels.PERIOD_PRICE }
                            name={ `period_price_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': systemLabels.ERRORS.EMPTY_FIELD,
                              'validate': systemLabels.ERRORS.INVALID_VALUE
                            }}
                            placeholder={ formLabels.PERIOD_PRICE_PLACEHOLDER }
                            validate={ isPositiveNumber }
                            min={ 0 }
                            formatOptions={{
                              style: "currency",
                              currency: "MXN",
                              currencySign: "accounting"
                            }}
                          />
                        </div>
                      </Surface>
                    </div>
                  </Tabs.Panel>
                );
              })
            }
          </Tabs>
        </FieldGroup>
        <Fieldset.Actions className="w-full grid grid-cols-6 gap-1 sticky bottom-0 bg-overlay p-2">
          <Button
            fullWidth
            className="col-span-2"
            variant="tertiary"
            onPress={ previousStep }
            size="lg"
          >
            { systemLabels.BUTTONS.PREVIOUS_STEP }
          </Button>
          <Button
            fullWidth
            className="col-span-4"
            form="sizes-form"
            type="submit"
            size="lg"
          >
            { systemLabels.BUTTONS.NEXT_STEP }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  );
}

export default FacesDataStep;
