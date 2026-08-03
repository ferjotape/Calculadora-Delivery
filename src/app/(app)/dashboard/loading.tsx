import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
      <div className="shrink-0">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="flex h-full min-h-0 flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-28" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-32" />
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
