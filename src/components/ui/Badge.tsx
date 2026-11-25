import * as React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  "new" | "exclusive" | "reduced" | "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  new: "bg-violet-100 text-violet-800",
  exclusive: "bg-gray-900 text-gray-0",
  reduced: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-violet-100 text-violet-700",
  neutral: "bg-gray-100 text-body",
};

export function Badge({ variant = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 type-caption whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}

export interface PenbBadgeProps {
  energyClass: string | null | undefined;
  className?: string;
}

const PENB_DOT_MAP: Record<string, string> = {
  A: "penb-dot-A",
  B: "penb-dot-B",
  C: "penb-dot-C",
  D: "penb-dot-D",
  E: "penb-dot-E",
  F: "penb-dot-F",
  G: "penb-dot-G",
};

export function PenbBadge({ energyClass, className }: PenbBadgeProps) {
  const code = energyClass?.toUpperCase();
  const dotClass = code ? PENB_DOT_MAP[code] : undefined;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill border border-line bg-surface px-2.5 type-caption text-strong whitespace-nowrap",
        className,
      )}
    >
      {dotClass ? (
        <span className={cn("h-2 w-2 rounded-pill shrink-0", dotClass)} aria-hidden="true" />
      ) : null}
      <span>{code ? `PENB ${code}` : "PENB neuvedeno"}</span>
    </span>
  );
}
