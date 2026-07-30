import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Fieldset,
  FieldGroup,
  Form,
  Surface,
  Typography
} from '@heroui/react';

import { isValidHeight } from '@/helpers/validators.helper';
import { OOH_TYPES } from '@/settings/keys.settings';

import { SelectField, MetersField } from '@/components/ui';

const TYPE_X_FACES = {
  UNIPOLE_BILLBOARD: [1, 2, 3, 4],
  HAND_PAINTED_MURAL: [1, 2],
  BARRICADE: [1],
  BUILDING_WRAP: [1, 2]
};

function StructureExample({ type, description }) {
  return (
    <Surface
      variant="secondary"
      className="p-2 border rounded-4xl"
    >
      <img
        alt={ type }
        src={ `/assets/utils/format_examples/${type}.png` }
        className="pointer-events-none aspect-square w-full rounded-3xl object-cover select-none"
        loading="lazy"
      />
      <p className="text-xs font-light py-2 leading-3.5 text-justify">
        { description }
      </p>
    </Surface>
  )
};

function StructureDataStep({ placement, formLabels, systemLabels, nextStep }) {
  const [selectedType, setSelectedType] = useState(placement.type || OOH_TYPES[0]);
  const [facesOptions, setFacesOptions] = useState(TYPE_X_FACES[selectedType]);
  
  const { handleSubmit, control } = useForm({
    defaultValues: {
      type: placement.type || OOH_TYPES[0],
      faces_number: placement.faces_number || placement.faces?.lenght || 1,
      structure_height: placement.structure_height || 0
    }
  });

  const TYPE_OPTIONS = OOH_TYPES.map((type) => ({
    id: type,
    label: formLabels.OPTIONS[type]
  }));

  const onTypeSelectedChange = (actualTypeSelected) => {
    setSelectedType(actualTypeSelected);
    setFacesOptions(TYPE_X_FACES[actualTypeSelected]);
  };

  return (
    <Form
      aria-label="structure-data-step"
      className="w-ful"
      onSubmit={ handleSubmit(nextStep) }
    >
      <Fieldset className="w-full">
        <FieldGroup className="w-full grid grid-cols-2 gap-1 px-2">
          <div className="col-span-2">
            <Typography.Heading level={ 6 }>
              { formLabels.STRUCTURE_DETAILS }
            </Typography.Heading>
            <Typography.Paragraph
              color="muted"
              size="xs"
              className="leading-3"
            >
              { formLabels.STRUCTURE_DETAILS_DESCRIPTION }
            </Typography.Paragraph>
          </div>
          <div className="col-span-1 h-fit">
            <StructureExample
              type={ selectedType }
              description={ formLabels.OPTIONS[`${selectedType}_DESCRIPTION`] }
            />
          </div>
          <div className="col-span-1 grid grid-cols-1 h-fit gap-2">
            <Surface
              variant="secondary"
              className="col-span-1 p-3 rounded-4xl"
            >
              <SelectField
                name="type"
                label={ formLabels.TYPE }
                control={ control }
                isRequired
                onChange={ onTypeSelectedChange }
                errors={{
                  'required': systemLabels.ERRORS.EMPTY_FIELD
                }}
                placeholder={ systemLabels.DEFAULTS.SELEC_ONE }
                options={ TYPE_OPTIONS }
              />
            </Surface>
            <Surface
              variant="secondary"
              className="col-span-1 p-3 rounded-4xl"
            >
              <SelectField
                name="faces_number"
                label={ formLabels.FACES }
                control={ control }
                isRequired
                options={ [...facesOptions] }
                errors={{
                  'required': systemLabels.ERRORS.EMPTY_FIELD,
                  'validate': systemLabels.ERRORS.INVALID_VALUE
                }}
                validate={ (actualValue) => {
                  return [ ...facesOptions ].includes(actualValue);
                }}
              />
            </Surface>
            <Surface
              variant="secondary"
              className="col-span-1 p-3 rounded-4xl"
            >
              <MetersField
                name="structure_height"
                control={ control }
                isRequired
                label={ formLabels.STRUCTURE_HEIGHT }
                errors={{
                  'required': systemLabels.ERRORS.EMPTY_FIELD,
                  'validate': systemLabels.ERRORS.INVALID_VALUE
                }}
                placeholder={ formLabels.INPUT_METERS_PLACEHOLDER }
                validate={ isValidHeight }
              />
            </Surface>
          </div>
        </FieldGroup>
        <Fieldset.Actions className="w-full sticky bottom-0 bg-overlay p-2">
          <Button
            fullWidth
            type="submit"
            size="lg"
          >
            { systemLabels.BUTTONS.SAVE_CONTINUE }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  );
};

export default StructureDataStep;
