import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button, Fieldset, FieldGroup, Form, Spinner, Typography } from '@heroui/react';

import { DescriptionField, FlatCard, SelectField } from '@/components/ui';

function PlacementDetails({
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

  return (
    <Form
      id="description-form"
      aria-label="description form"
      className="w-full"
      onSubmit={ handleSubmit((formValues) => nextStep(formValues, true)) }
    >
      <Fieldset className="w-full">
        {/* Description Textarea */}
        <FieldGroup className="w-full grid grid-cols-5 gap-1">
          <div className="col-span-5">
            <Typography.Heading level="6" color="muted">
              { t('placements:form.description') }
            </Typography.Heading>
          </div>
          <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
            <FlatCard
              variant="primary"
              className="col-span-2 p-3"
            >
              <DescriptionField
                name='description'
                control={ control }
                isDisabled={ isPending }
                placeholder={ t('placements:form.descriptionPlaceholder') }
                rows={ 6 }
              />
            </FlatCard>
          </FlatCard>
          {/* <div className="col-span-2 border-l-2 pl-3 h-fit">
            <Description className="leading-5 text-md text-left">
              { t('placements:form.structureDescription') }
            </Description>
          </div> */}
        </FieldGroup>
        {/* Visibility Select */}
        <FieldGroup className="w-full grid grid-cols-5 gap-1">
          <div className="col-span-5">
            <Typography.Heading level="6" color="muted">
              { t('placements:form.visibility') }
            </Typography.Heading>
          </div>
          <FlatCard variant="default" className="col-span-3 grid grid-cols-2 gap-1 mr-5">
            <FlatCard
              variant="primary"
              className="col-span-2 p-3"
            >
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
            </FlatCard>
          </FlatCard>
        </FieldGroup>

        {/* Actions: Buttons */}
        <Fieldset.Actions className="w-full">
          <Button
            variant="tertiary"
            onPress={ previousStep }
            size="lg"
            isDisabled={ isPending }
          >
            { t('common:actions.previousStep') }
          </Button>
          <Button
            form="description-form"
            type="submit"
            size="lg"
            isDisabled={ isPending }
            isPending={ isPending }
          >
            { isPending ? <Spinner color="current" size="sm" /> : null }
            { t('common:actions.complete') }
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  );
}

export default PlacementDetails;
