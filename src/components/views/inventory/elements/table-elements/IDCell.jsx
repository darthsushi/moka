import { Typography } from "@heroui/react";

function IDCell({ code }) {
  return (
    <div className="w-full max-w-45 flex flex-col px-1 py-2 justify-center">
      <Typography weight="semibold" type="body-sm">
        #{ code }
      </Typography>
    </div>
  );
};

export default IDCell;
