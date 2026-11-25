"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const GlassNestContext = React.createContext(false);

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl" | "2xl" | "pill";
}

const LEVEL_MAP = {
  1: "glass-1",
  2: "glass-2",
  3: "glass-3",
};

const PADDING_MAP = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

const RADIUS_MAP = {
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  pill: "rounded-pill",
};

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ level = 2, padding = "md", radius = "xl", className, children, ...props }, ref) => {
    const isNested = React.useContext(GlassNestContext);
    // Pravidlo DESIGN.md: nikdy sklo ve skle -> vnořený panel se automaticky přepne na čistý povrch
    const surfaceClass = isNested ? "bg-surface border border-line shadow-card" : LEVEL_MAP[level];

    return (
      <GlassNestContext.Provider value={true}>
        <div
          ref={ref}
          data-glass-level={isNested ? "nested-fallback" : String(level)}
          className={cn(surfaceClass, PADDING_MAP[padding], RADIUS_MAP[radius], className)}
          {...props}
        >
          {children}
        </div>
      </GlassNestContext.Provider>
    );
  },
);
GlassPanel.displayName = "GlassPanel";
