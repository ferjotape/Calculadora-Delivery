import { Skeleton } from "@/components/Skeleton";

export default function RecipeDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>

        <Skeleton className="h-40 w-full" />

        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
