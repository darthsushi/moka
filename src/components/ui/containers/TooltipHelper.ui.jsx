import { Chip, Tooltip } from '@heroui/react';
import Icon from '../icons/Icon.ui';

function TooltipHelper({
  variant = 'soft',
  color = 'accent',
  helpText = ''
}) {

  return (
    <Tooltip delay={ 0 }>
      <Tooltip.Trigger>
        <Chip
          size="sm"
          variant={ variant }
          color={ color }
          className="py-1 text-[13px]"
        >
          <Icon name="help" />
        </Chip>
      </Tooltip.Trigger>
      <Tooltip.Content className="flex gap-2">
        <Tooltip.Arrow />
        <Chip
          size="sm"
          variant={ variant }
          color={ color }
          className="text-[15px] flex-none"
        >
          <Icon name="help" filled />
        </Chip>
        <p className="break-normal">
          { helpText }
        </p>
      </Tooltip.Content>
    </Tooltip>
  )
};

export default TooltipHelper;
