"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ListingCardItem } from "@/db/queries/listings";
import { Badge } from "@/components/ui";
import { AMENITY_LABELS, formatPrice, formatPricePerM2 } from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";
import { useSession } from "@/components/auth/SessionProvider";
import { cn } from "@/lib/cn";

export interface ListingCardProps {
  listing: ListingCardItem;
  variant?: "vertical" | "horizontal";
  priority?: boolean;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFavoriteClick?: (listingId: string) => void;
}

export function ListingCard({
  listing,
  variant = "vertical",
  priority = false,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
  onFavoriteClick,
}: ListingCardProps) {
  const t = useTranslations("card");
  const { isFavorite, toggleFavorite } = useSession();
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const favorited = isFavorite(listing.id);

  const photos = listing.images;
  const activePhoto = photos[photoIdx] ?? photos[0];
  const priceText = formatPrice(listing.price, listing.priceUnit, {
    priceOnRequest: listing.priceOnRequest,
  });
  const perM2Text =
    listing.offerType === "sale" && !listing.priceOnRequest
      ? formatPricePerM2(listing.pricePerM2)
      : null;

  const locationLabel = listing.district ?? listing.city;
  const visibleAmenities = listing.amenities.slice(0, 3);
  const overflowCount = Math.max(0, listing.amenities.length - 3);
  const isHorizontal = variant === "horizontal";

  function handleHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(listing.id);
    onFavoriteClick?.(listing.id);
  }

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group relative min-w-0 rounded-xl border bg-surface p-2 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float",
        highlighted ? "border-accent ring-2 ring-violet-300" : "border-line-subtle",
        isHorizontal ? "grid grid-cols-1 gap-3 sm:grid-cols-[40%_1fr]" : "flex h-full flex-col",
      )}
    >
      {/* Obrázková část (4:3) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
        <Link
          href={`/nemovitost/${listing.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block h-full w-full"
        >
          {activePhoto ? (
            <Image
              src={getImageVariantUrl(activePhoto.storageKey, "card")}
              alt={activePhoto.alt}
              fill
              priority={priority}
              placeholder="blur"
              blurDataURL={activePhoto.blurDataUrl}
              sizes={
                isHorizontal
                  ? "(max-width: 640px) 100vw, 260px"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 310px"
              }
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
              <ImageOff className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
              <span className="type-caption">{t("noPhoto")}</span>
            </div>
          )}
        </Link>

        {/* Horní štítky */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
          {listing.isNew ? <Badge variant="new">{t("badgeNew")}</Badge> : null}
          {listing.isReduced ? <Badge variant="reduced">{t("badgeReduced")}</Badge> : null}
        </div>

        {/* Srdce oblíbených */}
        <button
          type="button"
          onClick={handleHeart}
          aria-pressed={favorited}
          aria-label={favorited ? t("favoriteRemove") : t("favoriteAdd")}
          className={cn(
            "glass-3 absolute top-2.5 right-2.5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-pill transition-transform duration-150 hover:scale-105 cursor-pointer",
            favorited ? "text-accent" : "text-strong",
          )}
        >
          <Heart
            className={cn("h-4.5 w-4.5", favorited && "fill-current")}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>

        {/* Tečky galerie (desktop hover) */}
        {photos.length > 1 ? (
          <div className="absolute right-0 bottom-2.5 left-0 z-20 hidden items-center justify-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
            {photos.slice(0, 5).map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Fotka ${idx + 1} z ${Math.min(5, photos.length)}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotoIdx(idx);
                }}
                className={cn(
                  "h-2 w-2 rounded-pill transition-transform duration-150 cursor-pointer",
                  idx === photoIdx
                    ? "scale-125 bg-gray-0 shadow-card"
                    : "bg-gray-0/65 hover:bg-gray-0",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Textová část */}
      <div className="flex flex-1 flex-col justify-between p-2.5 pt-3">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <p className="type-price text-strong">{priceText}</p>
            {listing.priceNegotiable && !listing.priceOnRequest ? (
              <span className="type-caption text-muted">{t("priceNegotiable")}</span>
            ) : null}
          </div>
          {perM2Text ? (
            <p className="mt-0.5 type-small text-muted tnum">{perM2Text}</p>
          ) : (
            <p className="mt-0.5 type-small text-muted">&nbsp;</p>
          )}

          <h3 className="mt-2 line-clamp-2 type-body font-medium text-strong">
            <Link
              href={`/nemovitost/${listing.slug}`}
              className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none"
            >
              {listing.title}
            </Link>
          </h3>

          <p className="mt-1.5 flex items-center gap-1.5 type-small text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{locationLabel}</span>
          </p>
        </div>

        <div
          className="mt-3 flex h-6 flex-nowrap items-center gap-1.5 overflow-hidden"
          aria-hidden={visibleAmenities.length === 0 ? true : undefined}
        >
          {visibleAmenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-pill border border-line-subtle bg-subtle px-2.5 type-caption text-body"
            >
              {AMENITY_LABELS[amenity] ?? amenity}
            </span>
          ))}
          {overflowCount > 0 ? (
            <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-pill bg-subtle px-2 type-caption text-muted tnum">
              +{overflowCount}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
