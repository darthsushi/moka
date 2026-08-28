import { Skeleton, Surface } from '@heroui/react';

function TableSkeleton({ columns = [],  }) {
  const repetitions = 5;

  return (
    <Surface
      variant="secondary"
      className="w-full h-full overflow-hidden grid grid-cols-1 gap-0.5 rounded-4xl py-8 px-2"
    >
      { 
        Array.from({ length: repetitions }).map((_, index) => (
          <Skeleton
            key={ index }
            animationType="shimmer"
            className="flex h-25 col-span-1 gap-1 p-3 justify-center items-center rounded-2xl"
          >
            {  columns.map((_, index) => (<Skeleton key={ index } className="h-full w-full rounded" />)) }
          </Skeleton>
        ))
      }
    </Surface>
  )
};

export default TableSkeleton;
