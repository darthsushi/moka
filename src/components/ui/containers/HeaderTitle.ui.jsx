import { Skeleton, Typography } from '@heroui/react';

function HeaderTitle({
    title,
    subtitle,
    isLoading = false
}) {
  return (
    <div className="flex w-fit max-w-full h-full justify-center flex-col">
      { isLoading ?
        <Skeleton className="w-[90%] h-[70%]" />
      :
        <>
          <Typography
            className="truncate"
            type="h4"
          >
            { title }
          </Typography>
          { subtitle && 
            <Typography
              color="muted"
              className="truncate"
              type="body-sm"
            >
              { subtitle }
            </Typography>
          }
        </>
      }
    </div>
  );
}

export default HeaderTitle;