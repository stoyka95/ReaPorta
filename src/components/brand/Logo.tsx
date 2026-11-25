import { BRAND } from "@/config/brand";
import { cn } from "@/lib/cn";
import { LogoMark } from "./LogoMark";

export interface LogoProps {
  variant?: "full" | "mark";
  tone?: "brand" | "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, { mark: string; text: string }> = {
  sm: { mark: "h-7 w-7", text: "text-xl" },
  md: { mark: "h-8 w-8", text: "text-2xl" },
  lg: { mark: "h-10 w-10", text: "text-3xl" },
};

export function Logo({ variant = "full", tone = "brand", size = "md", className }: LogoProps) {
  const sizes = SIZE_CLASSES[size];
  const toneClass =
    tone === "light" ? "text-gray-0" : tone === "dark" ? "text-strong" : "text-strong";
  const markTone = tone === "brand" ? "brand" : "mono";

  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", toneClass, className)}>
      <LogoMark tone={markTone} className={sizes.mark} />
      {variant === "full" && (
        <span className={cn("font-display font-semibold tracking-tight leading-none", sizes.text)}>
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
