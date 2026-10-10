import { Skeleton } from "@heroui/react";

function PlacementsListSkeleton() {
  const REPETITIONS = 10;

  return (
    <>
      {
        Array.from({ length: REPETITIONS }, (_, index) => (
          <div key={ index } className="shadow-panel space-y-5 col-span-1 bg-transparent p-4">
            <Skeleton className="h-45" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))
      }
    </>
  );
};

export default PlacementsListSkeleton;
