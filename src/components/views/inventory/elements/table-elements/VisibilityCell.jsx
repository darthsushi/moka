import { Chip } from "@heroui/react";

/* const STATE_COLOR = {
  'pending': 'warning',
  'active': 'success'
}; */

function VisibilityCell({/*  visibility, */ visibilityDisplay }) {

  return (
    <Chip variant="soft">
      { visibilityDisplay }
    </Chip>
  );
}

export default VisibilityCell;
