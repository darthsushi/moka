import { useTranslation } from 'react-i18next';
import { useController } from 'react-hook-form';
import { Chip, Input, Label, Slider } from '@heroui/react';

import { isNil, isNotNil, noop } from '@/helpers/ramda.helpers';
import FlatCard from '../containers/FlatCard.ui';

function RangeField({
  control,
  formatOptions,
  label,
  step,
  name,
  isDisabled = false,
  maxValue = 100,
  minValue = 100,
  marks = [],
  defaultValue = [0, 100],
  onChange = noop,
}) {
  const { t } = useTranslation();
  const { field } = useController({
    name,
    control,
    defaultValue,
    rules: { disabled: isDisabled }
  });

  const handleOnChangeEnd = (actualValue) => {
    field.onChange(actualValue);
    onChange(actualValue);
  }

  return (
    <FlatCard className="py-2">
      <Slider
        aria-label={ `${field.name} range` }
        className="w-full"
        step={ step }
        maxValue={ maxValue }
        minValue={ minValue }
        formatOptions={ formatOptions }
        defaultValue={ field.value || defaultValue }
        onChangeEnd={ handleOnChangeEnd }
      >
        { isNotNil(label) &&
          <Label>
            { label }
          </Label>
        }
        <Chip
          variant="soft"
          color="accent"
          size={ isNil(label) && 'lg' }
          className={ isNil(label) && 'w-full flex justify-center' }
        >
          <Slider.Output />
        </Chip>
        <Slider.Track className="shadow">
          {
            ({state}) => (
              <>
                <Slider.Fill />
                <Slider.Steps />
                {state.values.map((_, i) => (
                  <Slider.Thumb
                    key={ i }
                    index={ i }
                  />
                ))}
              </>
            )
          }
        </Slider.Track>
        { marks.length >= 1 &&
          <Slider.Marks>
            { 
              marks.map((markValue, index) => <Slider.Mark key={ index } value={ markValue } />)
            }
          </Slider.Marks>
        }
      </Slider>
      <div
        className="hidden"
        aria-label={ t('common:a11y.rangeInput') }
      >
        <Input
          aria-label={ t('common:a11y.rangeInput') }
          multiple
          onBlur={ field.onBlur }
          name={ field.name }
          value={ field.value }
          id={ `slider-field-${name}` }
          type="text"
          readOnly
          className="hidden"
        />
      </div>
    </FlatCard>
  );
};

export default RangeField;
