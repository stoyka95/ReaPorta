import Image from "next/image";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "h-10 w-10 text-sm", px: 40 },
  md: { box: "h-14 w-14 text-base", px: 56 },
  lg: { box: "h-24 w-24 text-2xl", px: 96 },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const cfg = SIZE_MAP[size];

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-violet-100 font-semibold text-violet-800 select-none border border-violet-200",
        cfg.box,
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={cfg.px}
          height={cfg.px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
      {!src ? <span className="sr-only">{name}</span> : null}
    </span>
  );
}
