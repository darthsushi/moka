import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Fieldset,
  FieldGroup,
  Form,
  Tabs,
  Typography,
} from '@heroui/react';

import { isNil } from '@/helpers/ramda.helpers';
import { isPositiveNumber, isValidHeight } from '@/helpers/validators.helper';

import { FlatCard, ImageField, MetersField, NumberField, RangeField } from '@/components/ui';
import { MAX_RENT_DAYS, MIN_RENT_DAYS } from '@/settings/defaults.settings';

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
    : actualPlacement.faces.length === actualPlacement.face_count;

  const faceByFormSelector = Array.from({ length: actualPlacement.face_count || 1 }, () => ({}));
  const actualFaces = isFacesNumberSync ? (actualPlacement.faces || faceByFormSelector) : faceByFormSelector;

  console.log('FacesDataStep buildStepObjects', actualFaces);
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

function FacesDataStep({ placement, previousStep, nextStep }) {
  const { t } = useTranslation();
  const [tabSelected, setTabSelected] = useState('face_1');

  const { defaultValues, faces } = buildStepObjects(placement);
  const { handleSubmit, control } = useForm({ defaultValues });

  const normalizeBeforeNextStep = (actualValues) => {
    nextStep({ faces:  normalizeFaces(faces, actualValues) });
  };

  const showFirstInvalidFace = (formErrors) => {
    const firstInvalidFace = faces.findIndex((_, index) =>
      Object.keys(formErrors).some((fieldName) => fieldName.endsWith(`_face_${index + 1}`))
    );

    if (firstInvalidFace >= 0) setTabSelected(`face_${firstInvalidFace + 1}`);
  };

  return (
    <Form
      id="sizes-form"
      aria-label={ t('placements:a11y.faces') }
      className="w-full"
      onSubmit={ handleSubmit(normalizeBeforeNextStep, showFirstInvalidFace) }
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
                aria-label={ t('placements:a11y.faceTabs') }
                className=" sticky top-1 bg-surface-secondary"
              >
                {
                  faces.map((_, face_index) => {

                    return (
                      <Tabs.Tab
                        className="text-xs"
                        key={ `face_${face_index + 1}` }
                        id={ `face_${face_index + 1}` }
                      >
                        { t(`placements:form.tabs.face${face_index + 1}`) }
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
                          { t('placements:form.images') }
                        </Typography.Heading>
                        <Typography.Paragraph
                          color="muted"
                          size="xs"
                          className="leading-3"
                        >
                          { t('placements:form.imagesDescription') }
                        </Typography.Paragraph>
                      </div>
                      <FlatCard
                        variant="secondary"
                        className="w-full"
                      >
                        <ImageField
                          name={ `images_face_${face_index + 1}` }
                          control={ control }
                          minImages={ 1 }
                          maxImages={ 3 }
                          errors={{
                            'required': t('validation:EMPTY_FIELD'),
                            'min': t('validation:EMPTY_FIELD'),
                            'max': t('validation:MAX_ALLOWED_ITEMS'),
                          }}
                        />
                      </FlatCard>
                    </div>
                    <div className="w-full py-2 flex flex-col gap-2">
                      <div className="px-1">
                        <Typography.Heading level={ 6 }>
                          { t('placements:form.displaySizes') }
                        </Typography.Heading>
                      </div>
                      <FlatCard
                        variant="secondary"
                        className="w-full grid grid-cols-4 gap-2"
                      >
                        <div className="col-span-2">
                          <MetersField
                            label={ t('placements:form.displayWidth') }
                            name={ `display_width_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': t('validation:EMPTY_FIELD'),
                              'validate': t('validation:INVALID_VALUE')
                            }}
                            placeholder={ t('placements:form.inputMetersPlaceholder') }
                            validate={ isValidHeight }
                          />
                        </div>
                        <div className="col-span-2">
                          <MetersField
                            label={ t('placements:form.displayHeight') }
                            name={ `display_height_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': t('validation:EMPTY_FIELD'),
                              'validate': t('validation:INVALID_VALUE')
                            }}
                            placeholder={ t('placements:form.inputMetersPlaceholder') }
                            validate={ isValidHeight }
                          />
                        </div>
                      </FlatCard>
                    </div>
                    <div className="w-full py-2 flex flex-col gap-2">
                      <div className="px-1">
                        <Typography.Heading level={ 6 }>
                          { t('placements:form.rentalPeriod') }
                        </Typography.Heading>
                      </div>
                      <FlatCard className="w-full grid grid-cols-4 gap-2">
                        <div className="col-span-4">
                          <RangeField
                            label={ t('placements:form.rangeDays') }
                            name={ `day_range_face_${face_index + 1}` }
                            maxValue={ MAX_RENT_DAYS }
                            minValue={ MIN_RENT_DAYS }
                            step={ MIN_RENT_DAYS }
                            control={ control }
                            defaultValue={ [30, 90] }
                            formatOptions={{
                              style: 'unit',
                              unit: 'day',
                              unitDisplay: 'long'
                            }}
                          />
                        </div>
                        <div className="col-span-4">
                          <NumberField
                            label={ t('placements:form.periodPrice') }
                            name={ `period_price_face_${face_index + 1}` }
                            control={ control }
                            isRequired
                            errors={{
                              'required': t('validation:EMPTY_FIELD'),
                              'validate': t('validation:INVALID_VALUE')
                            }}
                            placeholder={ t('placements:form.periodPricePlaceholder') }
                            validate={ isPositiveNumber }
                            min={ 0 }
                            formatOptions={{
                              style: "currency",
                              currency: "MXN",
                              currencySign: "accounting"
                            }}
                          />
                        </div>
                      </FlatCard>
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
            { t('common:actions.previousStep') }
          </Button>
          <Button
            fullWidth
            className="col-span-4"
            form="sizes-form"
            type="submit"
            size="lg"
          >
            { t('common:actions.nextStep') }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  );
}

export default FacesDataStep;
