import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  Fieldset,
  FieldGroup,
  Form,
  Spinner,
  Tooltip,
  Typography
} from '@heroui/react';

import { isNil, isNotNil, not } from '@/helpers/ramda.helpers';
import { isValidCoodinates } from '@/helpers/validators.helper';

import { Animations } from '@/components/animations';
import { FlatCard, GoogleMapsView, Icon, TextField } from '@/components/ui';
import { Description } from '@heroui/react';

const getSingleStringCoor = ({ latitude, longitude }) => {
  if (isNil(latitude) || isNil(longitude)) {
    return undefined;
  }

  return `${latitude},${longitude}`;
};

function LocationViewer({
    coordinates,
    location,
    labels: { systemLabels, formLabels },
    actions: { editLocation }
  }) {

  return (
    <>
      <div className="w-full pb-3">
        <Typography.Heading level={ 6 }>
          { formLabels.LOCATION }
        </Typography.Heading>
        <Typography.Paragraph color="muted" size="xs" className="leading-3">
          { formLabels.LOCATION_DESCRIPTION }
        </Typography.Paragraph>
      </div>
      <GoogleMapsView
        name="map_preview"
        className="grid grid-cols-5"
        coordinates={ coordinates }
      >
        <>
          <div className="col-span-4">
            <Typography type="body-sm" weight="normal" className="leading-3.5 mb-1 truncate">
              { location.display_name }
            </Typography>
            <Description className="text-xs leading-4 truncate">
              { location.city }, { location.state }, { location.country }
            </Description> 
          </div>
          <div className="col-span-1">
            <Tooltip>
              <Button
                variant="outline"
                className="w-full text-lg"
                onPress={ editLocation }
              >
                <Icon name="edit" />
              </Button>
              <Tooltip.Content>
                <p>
                  { systemLabels.TOOLTIPS.EDIT }
                </p>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </>
      </GoogleMapsView>
    </>
  );
};

function CoordinatesStep({ placement, formLabels, systemLabels, previousStep, nextStep }) {;
  const [coordinates, setCoordinates] = useState(() => getSingleStringCoor(placement));
  const [isValidated, setIsValidated] = useState(() => isNotNil(coordinates));
  const [location, setLocation] = useState(placement.location || {});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const { handleSubmit, control } = useForm({
    defaultValues: {
      coordinates: getSingleStringCoor(placement),
      location: placement.location || {},
      code: placement.code || '',
    },
  });

  const fetchOpenStreetMap = async (actualCoordinates) => {
    setIsLoading(true);

    try {
      const [latitude, longitude] = actualCoordinates.split(',');

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
      setCoordinates(actualCoordinates);

      setIsValidated(true);
      setIsError(false);
    } catch {
      setCoordinates(null);

      setIsValidated(false);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (formValues) => {
    if (isValidated) {
      const [latitude, longitude] = coordinates.split(',');

      nextStep({
        location,
        ...{
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
      });

      return;
    }

    fetchOpenStreetMap(formValues.coordinates || '');
  };
  
  return (
    <Form
      id="coordinates-form"
      aria-label="coordinates-form"
      className="w-full"
      onSubmit={ handleSubmit(onSubmit) }
    > 
      <Fieldset className="w-full">
        <div className="w-full px-2 py-3">
          { isError &&
            <Alert status="danger" className='bg-danger-soft my-3'>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  { formLabels.ERRORS.LOCATION_NOT_FOUND_TITLE }
                </Alert.Title>
                <Alert.Description>
                  { formLabels.ERRORS.LOCATION_NOT_FOUND }
                </Alert.Description>
              </Alert.Content>
            </Alert>
          }
          <Animations.DoubleCard animationId={ isValidated ? 'map-preview' : 'coordinates-input' }>
            { 
              isValidated ?
                <LocationViewer
                  coordinates={ coordinates }
                  location={ location }
                  labels={ { systemLabels, formLabels } }
                  actions={ { editLocation: () => setIsValidated(false) } }
                />
              : 
                <FlatCard
                  variant="secondary"
                  className="w-full p-3 mt-2"
                >
                  <div className="w-full grid grid-cols-6">
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
                        { formLabels.LATITUDE_LONGITUDE }
                      </Typography.Heading>
                      <Typography.Paragraph
                        color="muted"
                        size="xs"
                        className="leading-3"
                      >
                        { formLabels.LATITUDE_LONGITUDE_DESCRIPTION }
                      </Typography.Paragraph>
                    </div>
                  </div>
                  <FieldGroup className="w-full grid grid-cols-8 gap-2 mt-5">
                    <div className="col-span-8">
                      <TextField
                        name="coordinates"
                        control={ control }
                        isRequired
                        autoFocus
                        onChange={ () => setIsValidated(false) }
                        errors={{
                          'required': systemLabels.ERRORS.EMPTY_FIELD,
                          'validate': systemLabels.ERRORS.INVALID_COORDINATES
                        }}
                        isDisabled={ isLoading }
                        placeholder={ formLabels.LATITUDE_LONGITUDE_PLACEHOLDER }
                        validate={ isValidCoodinates }
                      />
                    </div>
                  </FieldGroup>
                </FlatCard>
            }
          </Animations.DoubleCard>
        </div>
        <Fieldset.Actions className="w-full grid grid-cols-6 gap-1 sticky bottom-0 bg-overlay p-2">
          <Button
            fullWidth
            className="col-span-2"
            variant="tertiary"
            size="lg"
            onPress={ previousStep }
          >
            { systemLabels.BUTTONS.PREVIOUS_STEP }
          </Button>
          <Button
            fullWidth
            className="col-span-4"
            form="coordinates-form"
            type="submit"
            size="lg"
            variant={ isValidated ? 'primary' : 'danger-soft' }
            isPending={ isLoading }
          >
            { isLoading ? <Spinner color="current" size="sm" /> : null }
            {
              isValidated
              ? systemLabels.BUTTONS.SAVE_CONTINUE
              : systemLabels.BUTTONS.FIND_LOCATION
            }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  );
};

export default CoordinatesStep;
