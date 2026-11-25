"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "warning" | "danger" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast musí být použit uvnitř ToastProvider.");
  }
  return ctx;
}

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success shrink-0" strokeWidth={1.75} />,
  warning: <AlertTriangle className="h-5 w-5 text-warning shrink-0" strokeWidth={1.75} />,
  danger: <AlertCircle className="h-5 w-5 text-danger shrink-0" strokeWidth={1.75} />,
  info: <Info className="h-5 w-5 text-accent-text shrink-0" strokeWidth={1.75} />,
};

export function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss?: () => void }) {
  const tone = toast.tone ?? "info";
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!onDismiss || paused) return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss, paused]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "glass-3 reaporta-panel-enter flex w-full max-w-sm items-start gap-3 rounded-lg p-4",
      )}
    >
      <span className="mt-0.5" aria-hidden="true">
        {TONE_ICON[tone]}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="type-small font-medium text-strong">{toast.title}</p>
        {toast.description ? (
          <p className="type-caption text-muted font-normal">{toast.description}</p>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Zavřít oznámení"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-hover hover:text-strong cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-70 flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
            <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
