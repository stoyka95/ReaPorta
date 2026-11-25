"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ label, description, id, className, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-center justify-between gap-4 min-h-11">
      {label ? (
        <div className="space-y-0.5">
          <label
            htmlFor={switchId}
            className="block type-small font-medium text-strong cursor-pointer select-none"
          >
            {label}
          </label>
          {description ? (
            <p className="type-caption text-muted font-normal">{description}</p>
          ) : null}
        </div>
      ) : null}
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 items-center rounded-pill border border-transparent bg-gray-300 p-0.5 transition-colors duration-200 cursor-pointer data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-pill bg-surface shadow-card transition-transform duration-200 ease-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
      </SwitchPrimitive.Root>
    </div>
  );
});
Switch.displayName = "Switch";
