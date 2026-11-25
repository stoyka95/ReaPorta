"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

export function Select({
  label,
  placeholder,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  error,
  helperText,
  id,
  ariaLabel,
  className,
}: SelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {label ? (
        <label htmlFor={selectId} className="block type-small font-medium text-strong">
          {label}
        </label>
      ) : null}
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          aria-label={!label ? ariaLabel : undefined}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            "input-focus-halo inline-flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3.5 text-base text-strong transition-[border-color,box-shadow] duration-150 cursor-pointer data-[placeholder]:text-muted disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
            error ? "border-danger" : "border-line hover:border-line-strong",
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="glass-3 reaporta-panel-enter z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg p-1.5"
          >
            <SelectPrimitive.Viewport className="space-y-0.5">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="relative flex min-h-10 select-none items-center justify-between rounded-sm px-3 py-2 type-small text-body outline-none cursor-pointer data-[highlighted]:bg-violet-100 data-[highlighted]:text-violet-800 data-[state=checked]:font-medium data-[state=checked]:text-strong data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <Check
                      className="h-4 w-4 text-accent-text"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? (
        <p role="alert" className="flex items-center gap-1.5 type-small text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="type-small text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
