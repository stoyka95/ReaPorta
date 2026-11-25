import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, helperText, error, leftIcon, rightAdornment, id, className, disabled, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="block type-small font-medium text-strong">
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "input-focus-halo relative flex h-12 w-full items-center rounded-md border bg-surface transition-[border-color,box-shadow] duration-150",
            error ? "border-danger" : "border-line hover:border-line-strong",
            disabled && "bg-subtle opacity-60 cursor-not-allowed",
          )}
        >
          {leftIcon ? (
            <span
              className="pointer-events-none pl-3.5 text-muted flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "h-full w-full bg-transparent px-3.5 text-base text-strong placeholder:text-muted focus:outline-none disabled:cursor-not-allowed",
              leftIcon ? "pl-2.5" : "",
              rightAdornment ? "pr-2.5" : "",
              className,
            )}
            {...props}
          />
          {rightAdornment ? (
            <span className="pr-3.5 text-muted type-small flex items-center shrink-0">
              {rightAdornment}
            </span>
          ) : null}
        </div>
        {error ? (
          <p id={errorId} role="alert" className="flex items-center gap-1.5 type-small text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="type-small text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
