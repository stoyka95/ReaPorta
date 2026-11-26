import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepItem {
  id: string;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Kroky formuláře" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
        {steps.map((step, idx) => {
          const done = idx < currentStep;
          const active = idx === currentStep;
          return (
            <li
              key={step.id}
              className="flex items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill type-caption font-semibold tnum transition-colors duration-200",
                  done
                    ? "bg-violet-100 text-violet-800"
                    : active
                      ? "bg-accent text-on-accent shadow-accent"
                      : "border border-line bg-surface text-muted",
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={cn(
                  "type-small whitespace-nowrap",
                  active
                    ? "font-semibold text-strong"
                    : done
                      ? "font-medium text-body"
                      : "text-muted",
                )}
              >
                {step.label}
              </span>
              {idx < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1 hidden h-px flex-1 min-w-4 sm:block",
                    done ? "bg-violet-300" : "bg-line",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
