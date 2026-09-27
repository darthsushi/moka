import { Typography } from "@heroui/react";

function IDCell({ code, isDisabled, onPress }) {
  return (
    <div className="w-full max-w-45 flex flex-col px-1 py-2 justify-center">
      <button type="button" onClick={ onPress } disabled={ isDisabled } className="w-fit text-left hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-default disabled:no-underline" aria-label={ `Ver detalles de ${code}` }>
        <Typography weight="semibold" type="body-sm">
          #{ code }
        </Typography>
      </button>
    </div>
  );
};

export default IDCell;
