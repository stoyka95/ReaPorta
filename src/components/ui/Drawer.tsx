"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  title: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  footer?: React.ReactNode;
  closeLabel?: string;
}

const SIDE_CLASSES = {
  right: "inset-y-0 right-0 h-dvh w-full max-w-md rounded-l-xl",
  left: "inset-y-0 left-0 h-dvh w-full max-w-sm rounded-r-xl",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] w-full rounded-t-xl",
};

export const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      title,
      description,
      side = "right",
      footer,
      closeLabel = "Zavřít panel",
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="scrim-backdrop fixed inset-0 z-50 backdrop-blur-xs" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "glass-3 reaporta-panel-enter fixed z-50 flex flex-col focus:outline-none",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-subtle px-6 py-4">
          <div className="space-y-0.5">
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
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-line-subtle bg-surface px-6 py-4">{footer}</div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DrawerContent.displayName = "DrawerContent";
