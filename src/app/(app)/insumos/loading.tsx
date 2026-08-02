import { Skeleton } from "@/components/Skeleton";

export default function IngredientsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full sm:w-72" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
