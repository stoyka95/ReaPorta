import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getVisiblePages(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Stránkování"
      className={cn("flex flex-wrap items-center justify-center gap-1 sm:gap-1.5", className)}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Předchozí stránka"
        className="inline-flex h-11 w-10 sm:w-11 items-center justify-center rounded-md border border-line bg-surface text-strong transition-colors duration-150 hover:bg-hover cursor-pointer disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {items.map((entry, idx) =>
        entry === "ellipsis" ? (
          <span
            key={`el-${idx}`}
            aria-hidden="true"
            className="inline-flex h-11 w-6 sm:w-9 items-center justify-center text-muted"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            aria-current={entry === page ? "page" : undefined}
            onClick={() => onPageChange(entry)}
            className={cn(
              "inline-flex h-11 min-w-9 sm:min-w-11 items-center justify-center rounded-md px-2 sm:px-3 type-small font-medium tnum transition-colors duration-150 cursor-pointer",
              entry === page
                ? "bg-accent text-on-accent shadow-accent"
                : "border border-line bg-surface text-body hover:bg-hover hover:text-strong",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Další stránka"
        className="inline-flex h-11 w-10 sm:w-11 items-center justify-center rounded-md border border-line bg-surface text-strong transition-colors duration-150 hover:bg-hover cursor-pointer disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </nav>
  );
}
