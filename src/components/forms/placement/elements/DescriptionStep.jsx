
import { useForm } from 'react-hook-form';
import { Button, Fieldset, FieldGroup, Form, Spinner } from '@heroui/react';
import { DescriptionField, FlatCard, SelectField } from '@/components/ui';

function DescriptionStep({
    placement,
    formLabels,
    systemLabels,
    previousStep,
    nextStep,
    isPending
  }) {
  const { handleSubmit, control } = useForm({
    defaultValues: {
      description: placement.description,
      visibility: placement.visibility || 'public'
    },
  });
  console.log('DescriptionStep render', placement);

  return (
    <Form
      id="description-form"
      aria-label="description-form"
      className="w-full"
      onSubmit={ handleSubmit((formValues) => nextStep(formValues, true)) }  
    >
      <Fieldset className="w-full">
        <div
          data-form-content
          aria-label="form-content"
          className="w-full px-2 grid grid-cols-4"
        >
          <div data-description-group className="col-span-4 py-2 flex flex-col gap-2">
            <FlatCard
              variant="secondary"
              className="w-full"
            >
              <FieldGroup className="w-full grid grid-cols-1 gap-2">
                <DescriptionField
                  label={ formLabels.DESCRIPTION }
                  name='description'
                  control={ control }
                  isDisabled={ isPending }
                  placeholder={ formLabels.DESCRIPTION_PLACEHOLDER }
                  rows={ 5 }
                />
              </FieldGroup>
            </FlatCard>
          </div>
          <div data-visibility-group className="col-span-2 py-2 flex flex-col gap-2">
            <FlatCard
              variant="secondary"
              className="w-full"
            >
              <FieldGroup className="w-full grid grid-cols-1 gap-2">
                <SelectField
                  label={ formLabels.VISIBILITY }
                  name="visibility"
                  control={ control }
                  isDisabled={ isPending }
                  isRequired
                  options={ [
                    { id: 'public', label: formLabels.OPTIONS.PUBLIC },
                    { id: 'private', label: formLabels.OPTIONS.PRIVATE },
                    { id: 'unlisted', label: formLabels.OPTIONS.UNLISTED }
                  ] }
                />
              </FieldGroup>
            </FlatCard>
          </div>
        </div>
        <Fieldset.Actions className="w-full grid grid-cols-6 gap-1 sticky bottom-0 bg-overlay p-2">
          <Button
            fullWidth
            className="col-span-2"
            variant="tertiary"
            onPress={ previousStep }
            size="lg"
            isDisabled={ isPending }
          >
            { systemLabels.BUTTONS.PREVIOUS_STEP }
          </Button>
          <Button
            fullWidth
            className="col-span-4"
            form="description-form"
            type="submit"
            size="lg"
            isDisabled={ isPending }
            isPending={ isPending }
          >
            {isPending ? <Spinner color="current" size="sm" /> : null}
            { systemLabels.BUTTONS.COMPLETE }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  )
}

export default DescriptionStep;
