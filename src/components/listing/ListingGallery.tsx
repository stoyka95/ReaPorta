"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, ImageOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, IconButton } from "@/components/ui";
import { formatPhotoCount } from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

export interface GalleryImage {
  id: string;
  storageKey: string;
  blurDataUrl: string;
  alt: string;
}

export interface ListingGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const t = useTranslations("detail");
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const touchStartX = React.useRef<number | null>(null);

  const openLightbox = (index: number, trigger?: HTMLButtonElement | null) => {
    if (trigger) triggerRef.current = trigger;
    setLightboxIndex(index);
  };

  const closeLightbox = React.useCallback(() => {
    setLightboxIndex(null);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  const showPrev = React.useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length));
  }, [images.length]);

  const showNext = React.useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
  }, [images.length]);

  React.useEffect(() => {
    if (lightboxIndex === null) return;
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        showNext();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] max-h-[460px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-line-subtle bg-gray-100 text-muted">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
        <p className="type-body">Tento inzerát zatím nemá nahrané fotografie.</p>
      </div>
    );
  }

  const cover = images[0]!;
  const thumbs = images.slice(1, 5);

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-line-subtle bg-surface shadow-card">
        {images.length === 1 ? (
          <button
            type="button"
            onClick={(e) => openLightbox(0, e.currentTarget)}
            className="group relative block aspect-[3/2] max-h-[520px] w-full overflow-hidden cursor-pointer"
          >
            <Image
              src={getImageVariantUrl(cover.storageKey, "full")}
              alt={cover.alt || title}
              fill
              priority
              placeholder="blur"
              blurDataURL={cover.blurDataUrl}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <div className="grid gap-1.5 md:grid-cols-4 md:grid-rows-2 md:h-[460px]">
            <button
              type="button"
              onClick={(e) => openLightbox(0, e.currentTarget)}
              className="group relative aspect-[3/2] md:aspect-auto md:col-span-2 md:row-span-2 overflow-hidden bg-gray-100 cursor-pointer"
            >
              <Image
                src={getImageVariantUrl(cover.storageKey, "full")}
                alt={cover.alt || title}
                fill
                priority
                placeholder="blur"
                blurDataURL={cover.blurDataUrl}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              />
            </button>

            {thumbs.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={(e) => openLightbox(idx + 1, e.currentTarget)}
                className={cn(
                  "group relative hidden overflow-hidden bg-gray-100 cursor-pointer md:block",
                  thumbs.length === 1 && "md:col-span-2 md:row-span-2",
                  thumbs.length === 2 && "md:col-span-2",
                  thumbs.length === 3 && idx === 2 && "md:col-span-2",
                )}
              >
                <Image
                  src={getImageVariantUrl(img.storageKey, "card")}
                  alt={img.alt}
                  fill
                  placeholder="blur"
                  blurDataURL={img.blurDataUrl}
                  sizes="25vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        )}

        <div className="absolute right-4 bottom-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Images className="h-4 w-4" strokeWidth={1.75} />}
            onClick={(e) => openLightbox(0, e.currentTarget)}
          >
            {t("showAllPhotos", { count: formatPhotoCount(images.length) })}
          </Button>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galerie fotografií (${lightboxIndex + 1} z ${images.length})`}
          className="scrim-lightbox fixed inset-0 z-60 flex flex-col items-center justify-between p-4 sm:p-6"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            const end = e.changedTouches[0]?.clientX;
            if (start !== null && end !== undefined) {
              const delta = end - start;
              if (delta > 50) showPrev();
              else if (delta < -50) showNext();
            }
            touchStartX.current = null;
          }}
        >
          {/* Horní lišta */}
          <div className="flex w-full max-w-6xl items-center justify-between gap-4">
            <span className="glass-3 rounded-pill px-3.5 py-1.5 type-small font-medium text-strong tnum">
              {lightboxIndex + 1} / {images.length}
            </span>
            <IconButton
              ref={closeBtnRef}
              variant="glass"
              size="md"
              aria-label={t("lightboxClose")}
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </IconButton>
          </div>

          {/* Hlavní fotka + šipky */}
          <div className="relative my-4 flex w-full max-w-5xl flex-1 items-center justify-center">
            {images.length > 1 ? (
              <IconButton
                variant="glass"
                size="md"
                aria-label={t("lightboxPrev")}
                onClick={showPrev}
                className="absolute left-0 z-10 sm:left-2"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </IconButton>
            ) : null}

            <div className="relative h-full max-h-[75dvh] w-full max-w-4xl overflow-hidden rounded-xl">
              <Image
                src={getImageVariantUrl(images[lightboxIndex]!.storageKey, "full")}
                alt={images[lightboxIndex]!.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {images.length > 1 ? (
              <IconButton
                variant="glass"
                size="md"
                aria-label={t("lightboxNext")}
                onClick={showNext}
                className="absolute right-0 z-10 sm:right-2"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </IconButton>
            ) : null}
          </div>

          {/* Popisek */}
          <p className="max-w-2xl text-center type-small text-gray-100">
            {images[lightboxIndex]!.alt}
          </p>
        </div>
      ) : null}
    </>
  );
}
