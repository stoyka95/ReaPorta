"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  title: string;
  description?: string;
  closeLabel?: string;
}

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ title, description, closeLabel = "Zavřít dialog", className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="scrim-backdrop fixed inset-0 z-50 backdrop-blur-xs" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "glass-3 reaporta-panel-enter fixed top-1/2 left-1/2 z-60 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 focus:outline-none",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <DialogPrimitive.Title className="type-h3 text-strong">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="type-small text-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-hover hover:text-strong cursor-pointer"
        >
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </DialogPrimitive.Close>
      </div>
      <div className="mt-5">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";
