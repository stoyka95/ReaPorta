import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  size?: "sm" | "md";
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, size = "md", className, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-pill border font-medium transition-[background-color,border-color,color] duration-200 ease-out cursor-pointer select-none disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-8 px-3 type-caption" : "h-9 px-3.5 type-small",
          selected
            ? "border-violet-200 bg-violet-100 text-violet-800"
            : "border-line bg-surface text-body hover:bg-hover hover:text-strong",
          className,
        )}
        {...props}
      >
        {selected ? (
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        ) : null}
        <span>{children}</span>
      </button>
    );
  },
);
Chip.displayName = "Chip";
