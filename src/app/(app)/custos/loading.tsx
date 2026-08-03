import { Skeleton } from "@/components/Skeleton";

export default function CostSettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-1 h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-4">
        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 lg:row-span-2 dark:border-neutral-700">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <Skeleton className="ml-auto h-9 w-40" />
      </div>
    </div>
  );
}
