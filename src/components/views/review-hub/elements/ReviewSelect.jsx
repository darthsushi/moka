import { ListBox, Select } from '@heroui/react';

export default function ReviewSelect({ value, onChange, options, placeholder, isDisabled = false }) {
  return (
    <Select value={ value || null } onChange={ onChange } placeholder={ placeholder } isDisabled={ isDisabled } className="min-w-48">
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover>
        <ListBox>
          { options.map(({ id, label: optionLabel }) => <ListBox.Item key={ id } id={ id } textValue={ optionLabel }>
            { optionLabel }<ListBox.ItemIndicator />
          </ListBox.Item>) }
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
