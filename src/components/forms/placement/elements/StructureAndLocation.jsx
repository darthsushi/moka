import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  Fieldset,
  FieldGroup,
  Form,
  Spinner,
  Typography,
} from '@heroui/react';

import { isNil, isNotNil, noop } from '@/helpers/ramda.helpers';
import { isValidCoodinates, isValidHeight } from '@/helpers/validators.helper';
import { OOH_TYPES } from '@/settings/keys.settings';

import { Animations } from '@/components/animations';
import { FlatCard, Icon, MetersField, SelectField, TextField } from '@/components/ui';

const TYPE_X_FACES = {
  UNIPOLE_BILLBOARD: [1, 2, 3, 4],
  HAND_PAINTED_MURAL: [1, 2],
  BARRICADE: [1],
  BUILDING_WRAP: [1, 2]
};

const getSingleStringCoor = ({ latitude, longitude }) => {
  if (isNil(latitude) || isNil(longitude)) {
    return undefined;
  }

  return `${latitude},${longitude}`;
};

function StructureAndLocation({
  placement = {},
  isLoading,
  nextStep = noop,
  setIsLoading = noop,
}) {
  // TODO: Remove "placement.face_count"
  const defaultValues = {
    type: placement.type || OOH_TYPES[0],
    face_count: placement.face_count || placement.faces?.lenght || 1,
    structure_height: placement.structure_height || 0,

    coordinates: getSingleStringCoor(placement),
    location: placement.location || {},
    code: placement.code || '',
  };

  const { t } = useTranslation();
  const { handleSubmit, control } = useForm({ defaultValues });

  const [selectedType, setSelectedType] = useState(defaultValues.type);
  const [facesOptions, setFacesOptions] = useState(TYPE_X_FACES[defaultValues.type]);

  const [coordinates, setCoordinates] = useState(defaultValues.coordinates);
  const [location, setLocation] = useState(defaultValues.location);

  const [isLocationError, setIsLocationError] = useState(false);
  const [isValidated, setIsValidated] = useState(() => isNotNil(coordinates));

  const TYPE_OPTIONS = OOH_TYPES.map((type) => ({
    id: type,
    label: t(`placements:types.${type}`)
  }));
  
  const onTypeSelectedChange = (selectedType) => {
    setSelectedType(selectedType);
    setFacesOptions(TYPE_X_FACES[selectedType]);
  };

  const onCoordinatesInputChange = (actualCoordinates) => {
    setIsValidated(false);
    console.log('teest coor', actualCoordinates);
  };

  const beforeSubmit = (values) => {
    console.log('Antes de enviar:', values);
    nextStep(values);
  };

  return (
    <>
      <Form
        aria-label="Structure and Location"
        className="w-ful"
        onSubmit={ handleSubmit(beforeSubmit) }
      >
        <Fieldset className="w-full">
          <FieldGroup className="w-full grid grid-cols-5">
            <div className="col-span-5">
              <Typography.Heading level="5" color="muted">
                { t('placements:form.structureDetails') }
              </Typography.Heading>
            </div>
            <div className="col-span-3 grid grid-cols-2 gap-1 p-2">
              <FlatCard
                variant="transparent"
                className="col-span-1 p-3"
              >
                <SelectField
                  name="type"
                  label={ t('placements:form.type') }
                  control={ control }
                  isRequired
                  onChange={ onTypeSelectedChange }
                  errors={{
                    'required': t('validation:EMPTY_FIELD')
                  }}
                  placeholder={ t('common:defaults.selectOne') }
                  options={ TYPE_OPTIONS }
                />
              </FlatCard>
              <FlatCard
                variant="transparent"
                className="col-span-1 p-3"
              >
                <SelectField
                  name="face_count"
                  label={ t('placements:form.faces') }
                  control={ control }
                  isRequired
                  options={ [...facesOptions] }
                  errors={{
                    'required': t('validation:EMPTY_FIELD'),
                    'validate': t('validation:INVALID_VALUE')
                  }}
                  validate={ (actualValue) => {
                    return [ ...facesOptions ].includes(actualValue);
                  }}
                />
              </FlatCard>
              <FlatCard
                variant="transparent"
                className="col-span-1 p-3"
              >
                <MetersField
                  name="structure_height"
                  control={ control }
                  isRequired
                  label={ t('placements:form.structureHeight') }
                  errors={{
                    'required': t('validation:EMPTY_FIELD'),
                    'validate': t('validation:INVALID_VALUE')
                  }}
                  placeholder={ t('placements:form.inputMetersPlaceholder') }
                  validate={ isValidHeight }
                />
              </FlatCard>
            </div>
            <div className="col-span-2">
              Description de datos de estructura
            </div>
          </FieldGroup>
          <FieldGroup className="w-full grid grid-cols-5">
            <div className="col-span-5">
              <Typography.Heading level="5" color="muted">
                { t('placements:form.location') }
              </Typography.Heading>
            </div>
            <div className="col-span-3 w-full p-4">
              { isLocationError &&
                <Alert status="danger" className='bg-danger-soft my-3'>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>
                      { t('placements:form.errors.locationNotFoundTitle') }
                    </Alert.Title>
                    <Alert.Description>
                      { t('placements:form.errors.locationNotFound') }
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              }
              <Animations.DoubleCard animationId={ isValidated ? 'map-preview' : 'coordinates-input' }>
                {
                  isValidated ?
                    <>
                      VAlidado!
                      {/* <LocationViewer
                        coordinates={ coordinates }
                        location={ location }
                        actions={ { editLocation: () => setIsValidated(false) } }
                      /> */}
                    </>
                  :
                    <FlatCard
                      variant="transparent"
                      className="w-full p-3"
                    >
                      {/* <div className="w-full grid grid-cols-6">
                        <div className="col-span-1 flex items-center justify-center">
                          {
                          isLoading ?
                            <Spinner size="lg" />
                          :
                            <FlatCard
                              rounded="sm"
                              className="w-15 h-15 flex justify-center items-center text-3xl text-rose-900 bg-rose-400 border border-rose-500"
                            >
                              <Icon filled name="add-location" />
                            </FlatCard>
                          }
                        </div>
                        <div className="col-span-5 h-fit">
                          <Typography.Heading level={ 6 }>
                            { t('placements:form.latitudeLongitude') }
                          </Typography.Heading>
                          <Typography.Paragraph
                            color="muted"
                            size="xs"
                            className="leading-3"
                          >
                            { t('placements:form.latitudeLongitudeDescription') }
                          </Typography.Paragraph>
                        </div>
                      </div> */}
                      <TextField
                        label={ t('placements:form.latitudeLongitude') }
                        name="coordinates"
                        control={ control }
                        isRequired
                        onChange={ onCoordinatesInputChange }
                        errors={{
                          'required': t('validation:EMPTY_FIELD'),
                          'validate': t('validation:INVALID_COORDINATES')
                        }}
                        isDisabled={ isLoading }
                        placeholder={ t('placements:form.latitudeLongitudePlaceholder') }
                        validate={ isValidCoodinates }
                      />
                    </FlatCard>
                }
              </Animations.DoubleCard>
            </div>
            <div className="col-span-2">
              Description de datos de estructura
            </div>
          </FieldGroup>
          <Fieldset.Actions className="w-full p-2">
            <Button
              type="submit"
              size="lg"
            >
              { t('common:actions.saveContinue') }
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </Form>
    </>
  )
};

export default StructureAndLocation;
