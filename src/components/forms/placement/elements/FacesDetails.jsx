import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button, Description, Fieldset, FieldGroup, Form, Tabs, Typography } from '@heroui/react';

import { isNil, noop } from '@/helpers/ramda.helpers';
import { isPositiveNumber, isValidHeight } from '@/helpers/validators.helper';
import { MAX_RENT_DAYS, MIN_RENT_DAYS } from '@/settings/defaults.settings';

import { FlatCard, MetersField, MultiViewImageField, NumberField, RangeField } from '@/components/ui';

const normalizeFaces = (actualFaces, actualValues) => {
  const newFaceArray = [];

  actualFaces.forEach((_, index) => {
    newFaceArray[index] = {
      id: actualFaces[index]?.id,
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

  const initialFaces = Array.from({ length: actualPlacement.face_count || 1 }, () => ({}));
  const actualFaces = isFacesNumberSync ? (actualPlacement.faces || initialFaces) : initialFaces;

  const actualFields = actualFaces.reduce((acc, item, index) => {
    acc[`display_width_face_${index + 1}`] = item.display_width;
    acc[`display_height_face_${index + 1}`] = item.display_height;
    acc[`period_price_face_${index + 1}`] = item.period_price || 0;
    acc[`day_range_face_${index + 1}`] = item.day_range || [30, 90];
    acc[`images_face_${index + 1}`] = item.images || { front: null, approach: null, surrounding: null };

    return acc;
  }, {});

  return { defaultValues: actualFields, faces: actualFaces };
};

function FacesDetails({
  placement = {},
  nextStep = noop,
  previousStep = noop,
}) {
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
      id="faces-details-form"
      aria-label={ t('placements:a11y.faces') }
      className="w-full"
      onSubmit={ handleSubmit(normalizeBeforeNextStep, showFirstInvalidFace) }
    >
      <Tabs
        selectedKey={ tabSelected }
        onSelectionChange={ setTabSelected }
      >
        {/* TODO: Remove list when is one face */}
        <Tabs.ListContainer className={ `w-fit ${ faces.length === 1 && 'hidden'}` }>
          <Tabs.List
            aria-label={ t('placements:a11y.faceTabs') }
            className="w-fit"
          >
            {
              faces.map((_, face_index) => {

                return (
                  <Tabs.Tab
                    className="w-fit"
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
                className={ `w-full ${ tabSelected !== `face_${face_index + 1}` && 'hidden' }` }
                shouldForceMount={ true }
              >
                <Fieldset className="w-full">
                  {/* IMAGES */}
                  <FieldGroup className="w-full grid grid-cols-5 gap-1">
                    <div className="col-span-5">
                      <Typography.Heading level="6" color="muted">
                        { t('placements:form.images') }
                      </Typography.Heading>
                    </div>
                    <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
                      <FlatCard
                        variant="primary"
                        className="col-span-2 p-3"
                      >
                        <MultiViewImageField
                          name={ `images_face_${face_index + 1}` }
                          control={ control }
                          ids={ [
                            { id: 'front', label: 'Frontal', required: true },
                            { id: 'approach', label: 'Aproximación', required: true },
                            { id: 'surrounding', label: 'Entorno', required: true },
                          ] }
                          className="flex justify-between items-center gap-0"
                          errors={{
                            'required': t('validation:EMPTY_FIELD'),
                          }}
                        />
                      </FlatCard>
                    </FlatCard>
                    <div className="col-span-2 border-l-2 pl-3 h-fit">
                      <Description className="leading-5 text-md text-left">
                        { t('placements:form.imagesDescription') }
                      </Description>
                    </div>
                  </FieldGroup>

                  {/* Display Sizes */}
                  <FieldGroup className="w-full grid grid-cols-5 gap-1">
                    <div className="col-span-5">
                      <Typography.Heading level="6" color="muted">
                        { t('placements:form.displaySizes') }
                      </Typography.Heading>
                    </div>
                    <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
                      <FlatCard
                        variant="primary"
                        className="col-span-1 p-3"
                      >
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
                      </FlatCard>
                      <FlatCard
                        variant="primary"
                        className="col-span-1 p-3"
                      >
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
                      </FlatCard>
                    </FlatCard>
                  </FieldGroup>

                  {/* Day Range */}
                   <FieldGroup className="w-full grid grid-cols-5 gap-1">
                    <div className="col-span-5">
                      <Typography.Heading level="6" color="muted">
                        { t('placements:form.rentalPeriod') }
                      </Typography.Heading>
                    </div>
                    <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
                      <FlatCard
                        variant="primary"
                        className="col-span-1 p-3"
                      >
                        <RangeField
                          name={ `day_range_face_${face_index + 1}` }
                          maxValue={ MAX_RENT_DAYS }
                          minValue={ MIN_RENT_DAYS }
                          step={ MIN_RENT_DAYS }
                          control={ control }
                          defaultValue={ [30, 60] }
                          marks={ [15, 30, 45, 60] }
                          formatOptions={{
                            style: 'unit',
                            unit: 'day',
                            unitDisplay: 'long'
                          }}
                        />
                      </FlatCard>
                      <FlatCard
                        variant="primary"
                        className="col-span-1 p-3"
                      >
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
                      </FlatCard>
                    </FlatCard>
                    <div className="col-span-2 border-l-2 pl-3 h-fit">
                      {/* <Description className="leading-5 text-md text-left">
                        { t('placements:form.imagesDescription') }
                      </Description> */}
                    </div>
                  </FieldGroup>
                </Fieldset>
              </Tabs.Panel>
            );
          })
        }
      </Tabs>
      <div className="w-full flex gap-2 p-2">
        <Button
          size="lg"
          isDisabled={ false }
          variant="tertiary"
          onPress={ previousStep }
        >
          { t('common:actions.previousStep') }
        </Button>
        <Button
          type="submit"
          size="lg"
          isDisabled={ false }
        >
          { t('common:actions.saveContinue') }
        </Button>
      </div>
    </Form>
  )
};

export default FacesDetails;
