"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, X, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MapPoint } from "@/db/queries/listings";
import { formatPrice } from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

export interface MapPreviewCardProps {
  point: MapPoint;
  onClose: () => void;
  className?: string;
}

export function MapPreviewCard({ point, onClose, className }: MapPreviewCardProps) {
  const tMap = useTranslations("map");
  const priceText = formatPrice(point.price, point.priceUnit, {
    priceOnRequest: point.priceOnRequest,
  });

  return (
    <div
      role="region"
      aria-label="Náhled vybrané nabídky"
      className={cn(
        "glass-3 reaporta-panel-enter relative flex w-full max-w-sm items-stretch gap-3 rounded-xl p-2.5",
        className,
      )}
    >
      <Link
        href={`/nemovitost/${point.slug}`}
        className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100"
      >
        {point.coverKey ? (
          <Image
            src={getImageVariantUrl(point.coverKey, "thumb")}
            alt={point.title}
            fill
            sizes="120px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 pr-7">
        <p className="type-body font-semibold text-strong tnum">{priceText}</p>
        <Link
          href={`/nemovitost/${point.slug}`}
          className="mt-0.5 line-clamp-2 block type-small font-medium text-strong hover:text-accent-text"
        >
          {point.title}
        </Link>
        <p className="mt-1 flex items-center gap-1 type-caption text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">{point.district ?? point.city}</span>
        </p>
        {!point.showExactLocation ? (
          <p className="mt-1 type-caption text-accent-text font-normal">
            {tMap("approximateNote")}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Zavřít náhled nabídky"
        className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-hover hover:text-strong cursor-pointer"
      >
        <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
