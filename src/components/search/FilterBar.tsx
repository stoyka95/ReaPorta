"use client";

import * as React from "react";
import { Bookmark, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PriceHistogramResult } from "@/db/queries/listings";
import {
  Badge,
  Button,
  Chip,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RangeSlider,
  SegmentedControl,
  Select,
  type ComboboxOption,
} from "@/components/ui";
import { DISPOSITIONS, type ListingCategory, type OfferType } from "@/lib/search/schema";
import type { UrlFilterState } from "@/lib/search/url-params";
import {
  DISPOSITION_LABELS,
  formatListingCount,
  formatShortPrice,
  LOCATION_TYPE_LABELS,
} from "@/lib/format";

interface SuggestApiItem {
  id: number;
  name: string;
  type: "kraj" | "okres" | "obec" | "cast";
  slug: string;
  fullSlug: string;
  listingCount: number;
  parentName: string | null;
}

export interface FilterBarProps {
  offerType: OfferType;
  category?: ListingCategory;
  pathLocationName?: string | null;
  urlState: UrlFilterState;
  activeFilterCount: number;
  histogram: PriceHistogramResult;
  onOfferChange: (nextOffer: OfferType) => void;
  onCategoryChange: (nextCategory: string) => void;
  onAddLocation: (fullSlug: string) => void;
  onRemovePathLocation: () => void;
  onPatchState: (patch: Partial<UrlFilterState>) => void;
  onOpenDrawer: () => void;
}

export function FilterBar({
  offerType,
  category,
  pathLocationName,
  urlState,
  activeFilterCount,
  histogram,
  onOfferChange,
  onCategoryChange,
  onAddLocation,
  onRemovePathLocation,
  onPatchState,
  onOpenDrawer,
}: FilterBarProps) {
  const t = useTranslations("search");
  const tHome = useTranslations("home");

  const [locQuery, setLocQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<ComboboxOption[]>([]);
  const [locLoading, setLocLoading] = React.useState(false);

  const [priceOpen, setPriceOpen] = React.useState(false);
  const [draftPriceMin, setDraftPriceMin] = React.useState<string>(
    urlState.cenaOd !== null ? String(urlState.cenaOd) : "",
  );
  const [draftPriceMax, setDraftPriceMax] = React.useState<string>(
    urlState.cenaDo !== null ? String(urlState.cenaDo) : "",
  );

  React.useEffect(() => {
    setDraftPriceMin(urlState.cenaOd !== null ? String(urlState.cenaOd) : "");
    setDraftPriceMax(urlState.cenaDo !== null ? String(urlState.cenaDo) : "");
  }, [urlState.cenaOd, urlState.cenaDo]);

  React.useEffect(() => {
    const trimmed = locQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLocLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLocLoading(true);
      try {
        const res = await fetch(`/api/locations/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: SuggestApiItem[] };
        setSuggestions(
          data.items.map((item) => ({
            value: item.fullSlug,
            label: item.name,
            meta: item.parentName ?? LOCATION_TYPE_LABELS[item.type] ?? item.type,
            badge: formatListingCount(item.listingCount),
          })),
        );
      } catch {
        // aborted
      } finally {
        setLocLoading(false);
      }
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locQuery]);

  const sliderMin = Math.max(0, Math.floor(histogram.min / 1000) * 1000);
  const sliderMax = Math.max(
    sliderMin + (offerType === "rent" ? 5000 : 500_000),
    Math.ceil(histogram.max / 1000) * 1000,
  );
  const sliderStep = offerType === "rent" ? 1000 : 100_000;
  const currentSliderMin = Math.max(sliderMin, Number(draftPriceMin) || sliderMin);
  const currentSliderMax = Math.min(sliderMax, Number(draftPriceMax) || sliderMax);

  function applyPrice() {
    const minVal = draftPriceMin.trim() ? Math.max(0, Math.round(Number(draftPriceMin))) : null;
    const maxVal = draftPriceMax.trim() ? Math.max(0, Math.round(Number(draftPriceMax))) : null;
    onPatchState({
      cenaOd: Number.isFinite(minVal) ? minVal : null,
      cenaDo: Number.isFinite(maxVal) ? maxVal : null,
      strana: 1,
    });
    setPriceOpen(false);
  }

  function toggleDisposition(disp: string) {
    const exists = urlState.dispozice.includes(disp);
    const next = exists
      ? urlState.dispozice.filter((d) => d !== disp)
      : [...urlState.dispozice, disp];
    onPatchState({ dispozice: next, strana: 1 });
  }

  const priceButtonLabel =
    urlState.cenaOd !== null || urlState.cenaDo !== null
      ? `${urlState.cenaOd !== null ? formatShortPrice(urlState.cenaOd) : "0"} – ${urlState.cenaDo !== null ? formatShortPrice(urlState.cenaDo) : "∞"}`
      : t("priceButton");

  const dispButtonLabel =
    urlState.dispozice.length > 0
      ? `${t("dispositionButton")} (${urlState.dispozice.length})`
      : t("dispositionButton");

  const categorySelectValue =
    category === "flat"
      ? "byty"
      : category === "house"
        ? "domy"
        : category === "land"
          ? "pozemky"
          : category === "commercial"
            ? "komercni"
            : category === "other"
              ? "ostatni"
              : "vse";

  return (
    <section
      aria-label="Filtry vyhledávání"
      className="glass-1 sticky top-13 sm:top-16 z-20 border-b border-line-subtle"
    >
      <div className="mx-auto max-w-[1536px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prodej / Pronájem */}
          <SegmentedControl
            size="sm"
            ariaLabel={t("offerLabel")}
            value={offerType}
            onChange={onOfferChange}
            options={[
              { value: "sale", label: "Prodej" },
              { value: "rent", label: "Pronájem" },
            ]}
          />

          {/* Kategorie */}
          <div className="w-40 sm:w-44">
            <Select
              ariaLabel={t("categoryLabel")}
              value={categorySelectValue}
              onValueChange={onCategoryChange}
              options={[
                { value: "vse", label: t("allCategories") },
                { value: "byty", label: tHome("categories.flat") },
                { value: "domy", label: tHome("categories.house") },
                { value: "pozemky", label: tHome("categories.land") },
                { value: "komercni", label: tHome("categories.commercial") },
                { value: "ostatni", label: tHome("categories.other") },
              ]}
            />
          </div>

          {/* Lokalita */}
          <div className="min-w-48 flex-1 sm:max-w-72">
            <Combobox
              ariaLabel="Přidat lokalitu"
              placeholder={pathLocationName ?? t("locationPlaceholder")}
              value={locQuery}
              onChange={setLocQuery}
              options={suggestions}
              loading={locLoading}
              onSelect={(opt) => {
                onAddLocation(opt.value);
                setLocQuery("");
              }}
            />
          </div>

          {/* Popover Cena s histogramem */}
          <Popover open={priceOpen} onOpenChange={setPriceOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={
                  urlState.cenaOd !== null || urlState.cenaDo !== null ? "secondary" : "secondary"
                }
                size="md"
                rightIcon={<ChevronDown className="h-4 w-4 text-muted" />}
                className={
                  urlState.cenaOd !== null || urlState.cenaDo !== null
                    ? "border-violet-200 bg-violet-100 text-violet-800"
                    : ""
                }
              >
                {priceButtonLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 space-y-4">
              <p className="type-small font-semibold text-strong">{t("priceTitle")}</p>
              <RangeSlider
                min={sliderMin}
                max={sliderMax}
                step={sliderStep}
                histogram={histogram.buckets}
                value={[
                  Math.min(currentSliderMin, currentSliderMax),
                  Math.max(currentSliderMin, currentSliderMax),
                ]}
                onValueChange={([lo, hi]) => {
                  setDraftPriceMin(lo <= sliderMin ? "" : String(lo));
                  setDraftPriceMax(hi >= sliderMax ? "" : String(hi));
                }}
                ariaLabelMin={t("priceFrom")}
                ariaLabelMax={t("priceTo")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t("priceFrom")}
                  type="number"
                  min={0}
                  step={sliderStep}
                  value={draftPriceMin}
                  onChange={(e) => setDraftPriceMin(e.target.value)}
                  placeholder="0"
                />
                <Input
                  label={t("priceTo")}
                  type="number"
                  min={0}
                  step={sliderStep}
                  value={draftPriceMax}
                  onChange={(e) => setDraftPriceMax(e.target.value)}
                  placeholder="Bez limitu"
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftPriceMin("");
                    setDraftPriceMax("");
                    onPatchState({ cenaOd: null, cenaDo: null, strana: 1 });
                    setPriceOpen(false);
                  }}
                >
                  {t("clearFilters")}
                </Button>
                <Button variant="primary" size="sm" onClick={applyPrice}>
                  {t("apply")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Popover Dispozice (pro byty, domy nebo vše) */}
          {category !== "land" && category !== "commercial" && category !== "other" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="md"
                  rightIcon={<ChevronDown className="h-4 w-4 text-muted" />}
                  className={
                    urlState.dispozice.length > 0
                      ? "border-violet-200 bg-violet-100 text-violet-800"
                      : ""
                  }
                >
                  {dispButtonLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-3">
                <p className="type-small font-semibold text-strong">{t("dispositionTitle")}</p>
                <div className="flex flex-wrap gap-2">
                  {DISPOSITIONS.map((d) => (
                    <Chip
                      key={d}
                      size="sm"
                      selected={urlState.dispozice.includes(d)}
                      onClick={() => toggleDisposition(d)}
                    >
                      {DISPOSITION_LABELS[d] ?? d}
                    </Chip>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          {/* Tlačítko Další filtry */}
          <Button
            variant="secondary"
            size="md"
            leftIcon={<SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />}
            onClick={onOpenDrawer}
          >
            <span>{t("moreFilters")}</span>
            {activeFilterCount > 0 ? (
              <Badge variant="new" className="ml-1">
                {activeFilterCount}
              </Badge>
            ) : null}
          </Button>

          {/* Uložit hledání (AC-2.8 — vyvolá výzvu k přihlášení do etapy 7) */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                leftIcon={<Bookmark className="h-4 w-4" strokeWidth={1.75} />}
              >
                <span className="hidden xl:inline">{t("saveSearch")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent title={t("saveSearchTitle")} description={t("saveSearchAuthNotice")}>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button variant="primary">Rozumím</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Aktivní lokality */}
        {pathLocationName || urlState.loc.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {pathLocationName ? (
              <button
                type="button"
                onClick={onRemovePathLocation}
                className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-violet-200 bg-violet-100 px-3 type-caption text-violet-800 hover:bg-violet-200 cursor-pointer"
              >
                <span>{pathLocationName}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
            {urlState.loc.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() =>
                  onPatchState({
                    loc: urlState.loc.filter((item) => item !== slug),
                    strana: 1,
                  })
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-violet-200 bg-violet-100 px-3 type-caption text-violet-800 hover:bg-violet-200 cursor-pointer"
              >
                <span>{slug.split("/").pop()}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
