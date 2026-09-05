import { Chip } from "@heroui/react";

const STATE_COLOR = {
  'pending': 'warning',
  'active': 'success'
};

function StatusCell({ status, displayStatus }) {

  return (
    <Chip color={ STATE_COLOR[status] } variant="soft">
      { displayStatus }
    </Chip>
  );
}

export default StatusCell;
