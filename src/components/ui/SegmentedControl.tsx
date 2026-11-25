"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );
  const count = Math.max(1, options.length);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-grid items-center rounded-pill border border-line bg-gray-100 p-1 select-none",
        size === "sm" ? "h-10" : "h-11",
        className,
      )}
      style={{
        /* token-ok: grid template columns driven by option count */
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-pill bg-surface shadow-card transition-transform duration-200 ease-out"
        style={{
          /* token-ok: percentage sliding pill indicator */
          width: `calc((100% - 0.5rem) / ${count})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 inline-flex h-full items-center justify-center rounded-pill px-4 font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap",
              size === "sm" ? "type-caption" : "type-small",
              checked ? "text-strong" : "text-body hover:text-strong",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
