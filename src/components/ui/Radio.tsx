"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioGroup = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />
));
RadioGroup.displayName = "RadioGroup";

export interface RadioItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  label: string;
  description?: string;
}

export const RadioItem = React.forwardRef<
  React.ComponentRef<typeof RadioGroupPrimitive.Item>,
  RadioItemProps
>(({ label, description, id, className, ...props }, ref) => {
  const generatedId = React.useId();
  const radioId = id ?? generatedId;

  return (
    <div className="flex items-start gap-3 min-h-11 py-1.5">
      <RadioGroupPrimitive.Item
        ref={ref}
        id={radioId}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border border-line-strong bg-surface transition-colors duration-150 cursor-pointer hover:border-accent data-[state=checked]:border-accent disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="h-2.5 w-2.5 rounded-pill bg-accent" />
      </RadioGroupPrimitive.Item>
      <div className="space-y-0.5">
        <label
          htmlFor={radioId}
          className="block type-small font-medium text-strong cursor-pointer select-none"
        >
          {label}
        </label>
        {description ? <p className="type-caption text-muted font-normal">{description}</p> : null}
      </div>
    </div>
  );
});
RadioItem.displayName = "RadioItem";
