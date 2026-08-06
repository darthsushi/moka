import { Skeleton } from "@heroui/react";

function PlacementsListSkeleton() {
  const REPETITIONS = 10;

  return (
    <>
      {
        Array.from({ length: REPETITIONS }, (_, index) => (
          <div key={ index } className="shadow-panel space-y-5 col-span-1 rounded-4xl bg-transparent p-4">
            <Skeleton className="h-32 rounded-4xl" />
            <div className="space-y-3">
              <Skeleton className="h-3 w-3/5 rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
              <Skeleton className="h-3 w-2/5 rounded-lg" />
            </div>
          </div>
        ))
      }
    </>
  );
};

export default PlacementsListSkeleton;
