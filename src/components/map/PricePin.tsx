"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { formatShortPrice } from "@/lib/format";

export interface PricePinProps {
  id: string;
  price: number | null;
  priceOnRequest: boolean;
  title: string;
  showExactLocation: boolean;
  highlighted?: boolean;
  selected?: boolean;
  visited?: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PricePin({
  id,
  price,
  priceOnRequest,
  title,
  showExactLocation,
  highlighted = false,
  selected = false,
  visited = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: PricePinProps) {
  const active = highlighted || selected;
  const label = priceOnRequest ? "Dotaz" : formatShortPrice(price);

  return (
    <button
      type="button"
      data-listing-pin={id}
      data-highlighted={active ? "true" : "false"}
      data-approx={showExactLocation ? "false" : "true"}
      aria-label={`${label} – ${title}${showExactLocation ? "" : " (přibližná poloha)"}`}
      aria-pressed={selected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative inline-flex items-center gap-1 rounded-pill px-2.5 py-1 type-caption tnum whitespace-nowrap transition-[transform,background-color,color,box-shadow] duration-150 ease-out cursor-pointer",
        active
          ? "z-30 scale-110 bg-accent text-on-accent shadow-accent"
          : visited
            ? "glass-3 text-muted hover:scale-105 hover:text-strong"
            : "glass-3 text-strong hover:scale-105 hover:bg-surface",
        !showExactLocation && !active && "border-dashed border-violet-400",
      )}
    >
      {!showExactLocation ? (
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 rounded-pill shrink-0", active ? "bg-gray-0" : "bg-violet-500")}
        />
      ) : null}
      <span>{label}</span>
    </button>
  );
}
