"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/cn";

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  histogram?: number[];
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  histogram,
  ariaLabelMin = "Minimální hodnota",
  ariaLabelMax = "Maximální hodnota",
  disabled = false,
  className,
}: RangeSliderProps) {
  const maxBucket = histogram && histogram.length > 0 ? Math.max(...histogram, 1) : 1;
  const span = Math.max(1, max - min);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {histogram && histogram.length > 0 ? (
        <div className="flex h-12 items-end gap-1 px-1" aria-hidden="true">
          {histogram.map((count, idx) => {
            const bucketStart = min + (idx / histogram.length) * span;
            const bucketEnd = min + ((idx + 1) / histogram.length) * span;
            const inRange = bucketEnd >= value[0] && bucketStart <= value[1];
            const pct = Math.max(8, Math.round((count / maxBucket) * 100));
            return (
              <span
                key={idx}
                className={cn(
                  "flex-1 rounded-t-xs transition-colors duration-150",
                  inRange ? "bg-violet-500" : "bg-violet-200",
                )}
                style={{
                  /* token-ok: histogram bar height percentage */
                  height: `${pct}%`,
                }}
              />
            );
          })}
        </div>
      ) : null}

      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          if (next.length >= 2) {
            onValueChange([next[0]!, next[1]!]);
          }
        }}
        className="relative flex h-6 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-pill bg-gray-200">
          <SliderPrimitive.Range className="absolute h-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={ariaLabelMin}
          className="block h-5 w-5 rounded-pill border-2 border-accent bg-surface shadow-card transition-transform duration-150 hover:scale-110 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
        />
        <SliderPrimitive.Thumb
          aria-label={ariaLabelMax}
          className="block h-5 w-5 rounded-pill border-2 border-accent bg-surface shadow-card transition-transform duration-150 hover:scale-110 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
