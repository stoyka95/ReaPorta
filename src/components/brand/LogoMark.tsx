import { useId } from "react";
import { cn } from "@/lib/cn";

export interface LogoMarkProps {
  tone?: "brand" | "mono";
  className?: string;
}

export function LogoMark({ tone = "brand", className }: LogoMarkProps) {
  const gradId = useId();

  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn("shrink-0", className)}>
      {tone === "brand" && (
        <defs>
          <linearGradient id={gradId} x1="5" y1="4" x2="35" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--violet-500)" />
            <stop offset="55%" stopColor="var(--violet-600)" />
            <stop offset="100%" stopColor="var(--violet-700)" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M6 35V18C6 10.268 12.268 4 20 4s14 6.268 14 14v17h-7.2V18a6.8 6.8 0 1 0-13.6 0v17H6Z"
        fill={tone === "brand" ? `url(#${gradId})` : "currentColor"}
      />
      <circle
        cx="20"
        cy="24.5"
        r="4.1"
        fill={tone === "brand" ? "var(--accent)" : "currentColor"}
      />
    </svg>
  );
}
