import { useController } from 'react-hook-form';
import { Input, Label, Slider, Surface } from '@heroui/react';

import { noop } from '@/helpers/ramda.helpers';

function RangeField({
  control,
  formatOptions,
  label,
  step,
  name,
  isDisabled = false,
  maxValue = 100,
  minValue = 100,
  defaultValue = [0, 100],
  onChange = noop,
}) {
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
    <Surface variant="transparent" className="py-2 rounded-4xl">
      <Slider
        className="w-full"
        step={ step }
        maxValue={ maxValue }
        minValue={ minValue }
        formatOptions={ formatOptions }
        defaultValue={ field.value || defaultValue }
        onChangeEnd={ handleOnChangeEnd }
      >
        <Label>
          { label }
        </Label>
        <Slider.Output />
        <Slider.Track className="bg-overlay shadow">
          {
            ({state}) => (
              <>
                <Slider.Fill />
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
      </Slider>
      <div
        className="hidden"
        aria-label="input slider hidden"
      >
        <Input
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
    </Surface>
  );
};

export default RangeField;
