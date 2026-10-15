import { useTranslation } from 'react-i18next';

import { useForm } from 'react-hook-form';
import { Button, Fieldset, FieldGroup, Form, Spinner } from '@heroui/react';
import { DescriptionField, FlatCard, SelectField } from '@/components/ui';

function DescriptionStep({
    placement,
    previousStep,
    nextStep,
    isPending
  }) {
  const { t } = useTranslation();
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
      aria-label={ t('placements:a11y.description') }
      className="w-full"
      onSubmit={ handleSubmit((formValues) => nextStep(formValues, true)) }
    >
      <Fieldset className="w-full">
        <div
          data-form-content
          aria-label={ t('common:a11y.formContent') }
          className="w-full px-2 grid grid-cols-4"
        >
          <div data-description-group className="col-span-4 py-2 flex flex-col gap-2">
            <FlatCard
              variant="secondary"
              className="w-full"
            >
              <FieldGroup className="w-full grid grid-cols-1 gap-2">
                <DescriptionField
                  label={ t('placements:form.description') }
                  name='description'
                  control={ control }
                  isDisabled={ isPending }
                  placeholder={ t('placements:form.descriptionPlaceholder') }
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
                  label={ t('placements:form.visibility') }
                  name="visibility"
                  control={ control }
                  isDisabled={ isPending }
                  isRequired
                  options={ [
                    { id: 'public', label: t('placements:visibility.public') },
                    { id: 'private', label: t('placements:visibility.private') },
                    { id: 'unlisted', label: t('placements:visibility.unlisted') }
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
            { t('common:actions.previousStep') }
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
            { t('common:actions.complete') }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  )
}

export default DescriptionStep;
