import {
  Alert,
  Button,
  Card,
  Fieldset,
  FieldGroup,
  Form,
  Spinner,
  Surface,
  Tooltip,
  Typography
} from '@heroui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { isValidCoodinates } from '../../../../helpers/validators.helper';
import { isNil, isNotNil, not } from '../../../../helpers/ramda.helpers';

import { TextField } from '../../../ui/fields';
import { Animations } from '../../../animations';
import Icon from '../../../icons';

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
  const [latitude, longitude] = coordinates.split(',');
  const MAP_URL = `https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

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
      <Card variant="secondary" className="w-full rounded-4xl">
        <Card.Header className="w-full grid grid-cols-5">
          <div className="col-span-4">
            <Card.Title className="leading-3.5 mb-1.5 truncate">
              { location.display_name }
            </Card.Title>
            <Card.Description className="text-xs leading-4 truncate">
              { location.city }, { location.state }, { location.country }
            </Card.Description> 
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
        </Card.Header>
        <Card.Content className="w-full h-50 rounded-3xl overflow-hidden shadow-md border border-default-200">
          <iframe
            title="map_preview"
            src={ MAP_URL }
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card.Content>
      </Card>
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
      const fetchResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`);
      
      if (not(fetchResponse.ok)) {
        throw new Error(`Error HTTP: ${fetchResponse.status}`);
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
          road,
          state
        },
        display_name
      } = await fetchResponse.json();

      setLocation({
        isoCode,
        display_name,
        city: municipality || city || county || town,
        country,
        country_code,
        neighbourhood,
        postcode,
        road,
        state
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
                <Surface
                  variant="secondary"
                  className="w-full p-3 rounded-4xl mt-2"
                >
                  <div className="w-full grid grid-cols-6">
                    <div className="col-span-1 flex items-center justify-center">
                      { 
                      isLoading ?
                        <Spinner size="lg" />
                      :
                        <Surface className="w-15 h-15 flex justify-center items-center text-3xl rounded-3xl text-rose-900 bg-rose-400 border border-rose-500">
                          <Icon filled name="add-location" />
                        </Surface>
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
                </Surface>
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
