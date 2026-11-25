import * as React from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const PADDING_MAP = {
  none: "",
  sm: "p-2",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ padding = "md", interactive = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-w-0 rounded-xl border border-line-subtle bg-surface shadow-card",
          interactive &&
            "transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float",
          PADDING_MAP[padding],
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";
