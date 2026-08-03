import { Skeleton } from "@/components/Skeleton";

export default function IngredientsLoading() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-3 overflow-hidden p-4 sm:p-6">
      <div className="shrink-0">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1 h-4 w-96 max-w-full" />
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3">
        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
        <div className="flex h-full min-h-0 flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-10 w-full sm:w-72" />
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
