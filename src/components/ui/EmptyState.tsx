import * as React from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-line-subtle bg-surface px-6 py-12 text-center shadow-card",
        className,
      )}
    >
      <svg viewBox="0 0 120 96" fill="none" aria-hidden="true" className="mb-5 h-24 w-30">
        <rect
          x="14"
          y="18"
          width="92"
          height="64"
          rx="16"
          fill="var(--violet-50)"
          stroke="var(--violet-200)"
          strokeWidth="1.5"
        />
        <path
          d="M42 70V46c0-9.941 8.059-18 18-18s18 8.059 18 18v24h-9V46a9 9 0 1 0-18 0v24h-9Z"
          fill="var(--violet-200)"
        />
        <circle cx="60" cy="54" r="5" fill="var(--accent)" />
        <circle cx="96" cy="24" r="6" fill="var(--violet-300)" />
        <rect x="24" y="28" width="12" height="4" rx="2" fill="var(--gray-300)" />
      </svg>
      <h3 className="type-h3 text-strong">{title}</h3>
      <p className="mt-2 max-w-md type-body text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
