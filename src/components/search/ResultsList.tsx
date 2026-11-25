"use client";

import * as React from "react";
import { LayoutGrid, List, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SearchListingsResult } from "@/db/queries/listings";
import { ListingCard } from "@/components/listing/ListingCard";
import { Button, EmptyState, IconButton, Pagination, Select } from "@/components/ui";
import type { SortOption } from "@/lib/search/schema";
import type { UrlFilterState, ViewMode } from "@/lib/search/url-params";
import { AMENITY_LABELS, formatListingCount, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface ResultsListProps {
  heading: string;
  results: SearchListingsResult;
  loading: boolean;
  urlState: UrlFilterState;
  splitMode?: boolean;
  highlightedId?: string | null;
  onHoverListing?: (id: string | null) => void;
  onSortChange: (sort: SortOption) => void;
  onViewChange: (view: ViewMode) => void;
  onPageChange: (page: number) => void;
  onPatchState: (patch: Partial<UrlFilterState>) => void;
  onClearAll: () => void;
}

export function ResultsList({
  heading,
  results,
  loading,
  urlState,
  splitMode = false,
  highlightedId,
  onHoverListing,
  onSortChange,
  onViewChange,
  onPageChange,
  onPatchState,
  onClearAll,
}: ResultsListProps) {
  const t = useTranslations("search");

  const activeTags: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (urlState.cenaOd !== null || urlState.cenaDo !== null) {
    activeTags.push({
      key: "price",
      label: `Cena: ${urlState.cenaOd !== null ? formatPrice(urlState.cenaOd) : "0 Kč"} – ${urlState.cenaDo !== null ? formatPrice(urlState.cenaDo) : "∞"}`,
      onRemove: () => onPatchState({ cenaOd: null, cenaDo: null, strana: 1 }),
    });
  }
  for (const d of urlState.dispozice) {
    activeTags.push({
      key: `disp-${d}`,
      label: d,
      onRemove: () =>
        onPatchState({ dispozice: urlState.dispozice.filter((x) => x !== d), strana: 1 }),
    });
  }
  for (const a of urlState.vybaveni) {
    activeTags.push({
      key: `am-${a}`,
      label: AMENITY_LABELS[a] ?? a,
      onRemove: () =>
        onPatchState({ vybaveni: urlState.vybaveni.filter((x) => x !== a), strana: 1 }),
    });
  }
  if (urlState.q.trim()) {
    activeTags.push({
      key: "q",
      label: `„${urlState.q.trim()}“`,
      onRemove: () => onPatchState({ q: "", strana: 1 }),
    });
  }
  if (urlState.bbox) {
    activeTags.push({
      key: "bbox",
      label: t("bboxActive"),
      onRemove: () => onPatchState({ bbox: null, strana: 1 }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Hlavička výsledků */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="type-h2 text-strong">{heading}</h1>
          <p aria-live="polite" className="type-body text-muted tnum">
            {formatListingCount(results.total)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-52">
            <Select
              ariaLabel={t("sortLabel")}
              value={urlState.razeni}
              onValueChange={(v) => onSortChange(v as SortOption)}
              options={[
                { value: "newest", label: t("sort.newest") },
                { value: "price_asc", label: t("sort.price_asc") },
                { value: "price_desc", label: t("sort.price_desc") },
                { value: "area_desc", label: t("sort.area_desc") },
                { value: "price_per_m2_asc", label: t("sort.price_per_m2_asc") },
              ]}
            />
          </div>

          <div className="hidden items-center gap-1 rounded-md border border-line bg-surface p-1 sm:inline-flex">
            <IconButton
              size="sm"
              variant={urlState.zobrazeni === "grid" ? "primary" : "ghost"}
              aria-label={t("viewGrid")}
              aria-pressed={urlState.zobrazeni === "grid"}
              onClick={() => onViewChange("grid")}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
            <IconButton
              size="sm"
              variant={urlState.zobrazeni === "list" ? "primary" : "ghost"}
              aria-label={t("viewList")}
              aria-pressed={urlState.zobrazeni === "list"}
              onClick={() => onViewChange("list")}
            >
              <List className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Aktivní filtry */}
      {activeTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeTags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={tag.onRemove}
              className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-violet-200 bg-violet-100 px-3 type-caption text-violet-800 hover:bg-violet-200 cursor-pointer"
            >
              <span>{tag.label}</span>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            {t("clearFilters")}
          </Button>
        </div>
      ) : null}

      {/* Výsledky nebo prázdný stav */}
      {results.items.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button variant="primary" size="md" onClick={onClearAll}>
              {t("clearFilters")}
            </Button>
          }
        />
      ) : (
        <div
          aria-busy={loading || undefined}
          className={cn(
            "transition-opacity duration-200",
            loading && "opacity-60",
            urlState.zobrazeni === "list"
              ? "grid grid-cols-1 gap-4"
              : splitMode
                ? "grid grid-cols-1 gap-5 sm:grid-cols-2"
                : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {results.items.map((listing, idx) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant={urlState.zobrazeni === "list" ? "horizontal" : "vertical"}
              priority={idx < 2}
              highlighted={highlightedId === listing.id}
              onMouseEnter={() => onHoverListing?.(listing.id)}
              onMouseLeave={() => onHoverListing?.(null)}
            />
          ))}
        </div>
      )}

      {/* Stránkování */}
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        onPageChange={onPageChange}
        className="pt-4"
      />
    </div>
  );
}
