"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ClusterPinProps {
  count: number;
  onClick: () => void;
}

export function ClusterPin({ count, onClick }: ClusterPinProps) {
  const sizeClass =
    count >= 50
      ? "h-12 w-12 type-small font-semibold"
      : count >= 10
        ? "h-10 w-10 type-caption font-semibold"
        : "h-9 w-9 type-caption font-semibold";

  return (
    <button
      type="button"
      data-cluster-pin="true"
      aria-label={`Shluk ${count} nabídek, kliknutím přiblížíte`}
      onClick={onClick}
      className={cn(
        "cluster-pin inline-flex items-center justify-center rounded-pill text-on-accent tnum transition-transform duration-150 ease-out hover:scale-110 cursor-pointer",
        sizeClass,
      )}
    >
      {count}
    </button>
  );
}
