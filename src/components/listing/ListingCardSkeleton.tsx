import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

export function ListingCardSkeleton({
  variant = "vertical",
}: {
  variant?: "vertical" | "horizontal";
}) {
  const isHorizontal = variant === "horizontal";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "min-w-0 rounded-xl border border-line-subtle bg-surface p-2 shadow-card",
        isHorizontal ? "grid grid-cols-1 gap-3 sm:grid-cols-[40%_1fr]" : "flex flex-col",
      )}
    >
      <Skeleton className="aspect-[4/3] w-full" rounded="lg" />
      <div className="flex flex-1 flex-col justify-between p-2.5 pt-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" rounded="md" />
          <Skeleton className="h-4 w-24" rounded="sm" />
          <Skeleton className="mt-2 h-5 w-full" rounded="sm" />
          <Skeleton className="h-4 w-44" rounded="sm" />
        </div>
        <div className="mt-3 flex gap-1.5">
          <Skeleton className="h-6 w-16" rounded="pill" />
          <Skeleton className="h-6 w-16" rounded="pill" />
          <Skeleton className="h-6 w-14" rounded="pill" />
        </div>
      </div>
    </div>
  );
}
