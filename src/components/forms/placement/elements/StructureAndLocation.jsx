import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  Description,
  Fieldset,
  FieldGroup,
  Form,
  Spinner,
  Tooltip,
  Typography,
  toast,
} from '@heroui/react';

import { isEmpty, /* isNil, */ isNotNil, noop, not } from '@/helpers/ramda.helpers';
import { isValidCoodinates, isValidHeight } from '@/helpers/validators.helper';
import { OOH_TYPES } from '@/settings/keys.settings';

import { Animations } from '@/components/animations';
import {
  DebouncedTextField,
  FlatCard,
  GoogleMapsView,
  Icon,
  MetersField,
  SelectField
} from '@/components/ui';

const TYPE_X_FACES = {
  UNIPOLE_BILLBOARD: [1, 2, 3, 4],
  HAND_PAINTED_MURAL: [1, 2],
  BARRICADE: [1],
  BUILDING_WRAP: [1, 2]
};

function LocationViewer({
    coordinates,
    location,
    editLocation = noop,
    isEditing
  }) {
  const { t } = useTranslation();

  return (
    <>
      <GoogleMapsView
        name="map_preview"
        className="grid grid-cols-5"
        variant="transparent"
        coordinates={ coordinates }
      >
        <>
          <div className={ isEditing ? 'col-span-5' : 'col-span-4' }>
            <Typography type="body-sm" weight="normal" className="leading-3.5 mb-1 truncate">
              { location.display_name }
            </Typography>
            <Description className="text-xs leading-4 truncate">
              { location.city }, { location.state }, { location.country }
            </Description>
          </div>
          { not(isEditing) &&
            <div className="col-span-1">
              <Tooltip>
                <Button
                  variant="tertiary"
                  className="w-full text-lg"
                  onPress={ editLocation }
                >
                  <Icon name="edit" />
                </Button>
                <Tooltip.Content>
                  <p>
                    { t('common:tooltips.edit') }
                  </p>
                </Tooltip.Content>
              </Tooltip>
            </div>
          }
        </>
      </GoogleMapsView>
    </>
  );
};

function StructureAndLocation({
  placement = {},
  nextStep = noop,
  isEditing = false
}) {
  // TODO: Remove "placement.face_count"
  const defaultValues = {
    type: placement.type || OOH_TYPES[0],
    face_count: placement.face_count || placement.faces?.lenght || 1,
    structure_height: placement.structure_height || 0,

    coordinates: placement.coordinates || null,
    location: placement.location || {},
    code: placement.code || '',
  };

  const { t } = useTranslation();
  const { resetField, handleSubmit, control } = useForm({ defaultValues });

  const [facesOptions, setFacesOptions] = useState(TYPE_X_FACES[defaultValues.type]);
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [location, setLocation] = useState(defaultValues.location);
  const [actualCoordinates, setActualCoordinates] = useState(defaultValues.coordinates);
  const [isLocationError, setIsLocationError] = useState(false);
  const [isValidated, setIsValidated] = useState(() => isNotNil(defaultValues.coordinates));

  const TYPE_OPTIONS = OOH_TYPES.map((type) => ({
    id: type,
    label: t(`placements:types.${type}`)
  }));
  
  const onTypeSelectedChange = (selectedType) => {
    setFacesOptions(TYPE_X_FACES[selectedType]);
  };

  const fetchOpenStreetMap = async (coordinates) => {
    setIsFetchingLocation(true);

    try {
      const [latitude, longitude] = coordinates.split(',');

      const nominatimURL = new URL('https://nominatim.openstreetmap.org/reverse');
      nominatimURL.search = new URLSearchParams({
        lat: latitude,
        lon: longitude,
        format: 'jsonv2',
        'accept-language': 'es-MX'
      });

      const nominatimResponse = await fetch(nominatimURL);

      if (not(nominatimResponse.ok)) {
        throw new Error(`Error HTTP: ${nominatimResponse.status}`);
      }

      const {
        address: {
          ["ISO3166-2-lvl4"]: isoCode,
          county,
          town,
          city,
          country,
          country_code,
          municipality,
          neighbourhood,
          postcode,
          region,
          road,
          state,
          village
        },
        display_name
      } = await nominatimResponse.json();

      setActualCoordinates(coordinates);
      setLocation({
        isoCode,
        display_name,
        country_code,
        neighbourhood,
        postcode,
        road,
        country,
        state: state || region,
        city: city || town || village || municipality || county,
      });

      setIsValidated(true);
      setIsLocationError(false);
    } catch {
      setActualCoordinates(null);
      setIsValidated(false);
      setIsLocationError(true);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const onLocationInputChange = (actualCoordinates) => {
    setIsValidated(false); // Set 'false' on input change.

    const showToastWithInvalidMessage = not(isValidCoodinates(actualCoordinates)) &&
      not(isEmpty(actualCoordinates)); // Do not show if input is empty.

    if (showToastWithInvalidMessage) {
      toast.danger(t('validation:INVALID_COORDINATES'));

      return;
    }
  
    fetchOpenStreetMap(actualCoordinates);
  };

  const onResetLocation = () => {
    setLocation(null);
    setActualCoordinates(null);
    setIsValidated(false);
    resetField('coordinates', { defaultValue: null });
  };

  const beforeSubmit = (values) => {
    nextStep({
      ...values,
      location,
      coordinates: actualCoordinates
    });
  };

  return (
    <Form
      id="structure-location-form"
      aria-label="Structure and Location"
      className="w-ful"
      onSubmit={ handleSubmit(beforeSubmit) }
    >
      <Fieldset className="w-full">
        {/* Structure inputs */}
        <FieldGroup className="w-full grid grid-cols-5 gap-1">
          <div className="col-span-5">
            <Typography.Heading level="6" color="muted">
              { t('placements:form.structureDetails') }
            </Typography.Heading>
          </div>
          <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
            <FlatCard
              variant="primary"
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
          </FlatCard>
          <div className="col-span-2 border-l-2 pl-3 h-fit">
            <Description className="leading-5 text-md text-left">
              { t('placements:form.structureDescription') }
            </Description>
          </div>
        </FieldGroup>

        {/* Location inputs */}
        <FieldGroup className="w-full grid grid-cols-5 gap-1">
          <div className="col-span-5">
            <Typography.Heading level="6" color="muted">
              { t('placements:form.location') }
            </Typography.Heading>
          </div>
          <FlatCard variant="default" className="col-span-3 mr-5">
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
                    <LocationViewer
                      coordinates={ actualCoordinates }
                      location={ location }
                      editLocation={ onResetLocation }
                      isEditing={ isEditing }
                    />
                  </>
                :
                  <FlatCard
                    variant="transparent"
                    className="w-full p-3"
                  >
                    <DebouncedTextField
                      label={ t('placements:form.latitudeLongitude') }
                      name="coordinates"
                      control={ control }
                      isRequired
                      onChange={ onLocationInputChange }
                      errors={{
                        'required': t('validation:EMPTY_FIELD'),
                        'validate': t('validation:INVALID_COORDINATES')
                      }}
                      isDisabled={ isFetchingLocation }
                      placeholder={ t('placements:form.latitudeLongitudePlaceholder') }
                      validate={ isValidCoodinates }
                    />
                    { isFetchingLocation &&
                      <Description className="mt-1.5 flex items-center gap-1">
                        <Spinner size="sm" />
                        { t('common:loading.fetchingLocation') }
                      </Description>
                    }
                  </FlatCard>
              }
            </Animations.DoubleCard>
          </FlatCard>
          <div className="col-span-2 border-l-2 pl-3 h-fit">
            <Description className="leading-5 text-md text-left">
              { t('placements:form.locationDescription') }
            </Description>
          </div>
        </FieldGroup>

        {/* Actions: Buttons */}
        <Fieldset.Actions className="w-full">
          <Button
            type="submit"
            size="lg"
            isDisabled={ isFetchingLocation || not(isValidated) }
          >
            { t('common:actions.saveContinue') }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  )
};

export default StructureAndLocation;
