import * as React from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  "aria-label": string;
}

const VARIANT_CLASSES: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  primary: "bg-accent text-on-accent btn-primary-highlight hover:bg-accent-hover",
  secondary: "bg-surface text-strong border border-line shadow-card hover:bg-hover",
  ghost: "bg-transparent text-body hover:bg-hover hover:text-strong",
  glass: "glass-3 text-strong hover:bg-surface",
};

const SIZE_CLASSES: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-pill transition-[transform,background-color,color,box-shadow] duration-150 ease-out cursor-pointer disabled:pointer-events-none disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
