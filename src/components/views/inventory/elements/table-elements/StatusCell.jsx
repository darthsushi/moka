import { Icon } from '@/components/ui';
import { Chip } from '@heroui/react';

const STATE_COLOR = {
  'pending': 'warning',
  'active': 'success',
  'approved': 'success',
  'paused': 'warning',
  'withdrawn': 'danger',
  'draft': 'secondary',
  'in_review': 'accent',
  'suspended': 'danger',
  'rejected': 'danger'
};

const STATE_ICON = {
  'draft': 'draft',
  'pending': 'schedule',
  'active': 'play-circle',
  'approved': 'verified',
  'paused': 'pause-circle',
  'withdrawn': 'auto-delete',
  'in_review': 'rate_review',
  'suspended': 'do-not-disturb',
  'rejected': 'error'
};

function StatusCell({ status, displayStatus }) {

  return (
    <Chip
      size="lg"
      variant="tertiary"
      color={ STATE_COLOR[status] }
    >
      <span className="px-0.5">
        <Icon
          filled
          name={ STATE_ICON[status] }
        />
      </span>
      { displayStatus }
    </Chip>
  );
}

export default StatusCell;
