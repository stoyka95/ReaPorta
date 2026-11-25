import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className, disabled, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label ? (
          <label htmlFor={textareaId} className="block type-small font-medium text-strong">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "input-focus-halo w-full rounded-md border bg-surface px-3.5 py-3 text-base text-strong placeholder:text-muted transition-[border-color,box-shadow] duration-150 focus:outline-none disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-60",
            error ? "border-danger" : "border-line hover:border-line-strong",
            className,
          )}
          {...props}
        />
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
Textarea.displayName = "Textarea";
