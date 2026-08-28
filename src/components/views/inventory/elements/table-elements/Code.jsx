import { Typography } from "@heroui/react";

function CodeCell({ code, display_name }) {
  return (
    <div className="w-full max-w-45 flex flex-col px-1 py-2 justify-center">
      <Typography weight="semibold" type="body-sm">
        #{ code }
      </Typography>
      <Typography type="body-xs" color="muted" className="truncate">
        { display_name }
      </Typography>
    </div>
  );
};

export default CodeCell;
