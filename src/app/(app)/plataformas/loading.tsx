import { Skeleton } from "@/components/Skeleton";

export default function PlatformsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 sm:p-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-1 h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
