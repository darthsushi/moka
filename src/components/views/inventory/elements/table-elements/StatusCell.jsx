import { Chip } from "@heroui/react";

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

function StatusCell({ status, displayStatus }) {

  return (
    <Chip color={ STATE_COLOR[status] } variant="soft">
      { displayStatus }
    </Chip>
  );
}

export default StatusCell;
