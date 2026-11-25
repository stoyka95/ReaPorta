"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ label, description, id, className, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="flex items-start gap-3 min-h-11 py-1.5">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-xs border border-line-strong bg-surface text-on-accent transition-[background-color,border-color] duration-150 cursor-pointer hover:border-accent data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? (
        <div className="space-y-0.5">
          <label
            htmlFor={checkboxId}
            className="block type-small font-medium text-strong cursor-pointer select-none"
          >
            {label}
          </label>
          {description ? (
            <p className="type-caption text-muted font-normal">{description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
Checkbox.displayName = "Checkbox";
