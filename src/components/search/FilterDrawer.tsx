"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { PriceHistogramResult } from "@/db/queries/listings";
import { Button, Chip, Drawer, DrawerContent, Input, RangeSlider, Select } from "@/components/ui";
import {
  AMENITIES,
  BUILDING_TYPES,
  CONDITIONS,
  DISPOSITIONS,
  ENERGY_CLASSES,
  OWNERSHIPS,
  type ListingCategory,
  type OfferType,
} from "@/lib/search/schema";
import type { UrlFilterState } from "@/lib/search/url-params";
import {
  AMENITY_LABELS,
  BUILDING_TYPE_LABELS,
  CONDITION_LABELS,
  DISPOSITION_LABELS,
  formatListingCount,
  OWNERSHIP_LABELS,
} from "@/lib/format";

export interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerType: OfferType;
  category?: ListingCategory;
  urlState: UrlFilterState;
  totalResults: number;
  histogram: PriceHistogramResult;
  onPatchState: (patch: Partial<UrlFilterState>) => void;
  onClearAll: () => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  offerType,
  category,
  urlState,
  totalResults,
  histogram,
  onPatchState,
  onClearAll,
}: FilterDrawerProps) {
  const t = useTranslations("search");
  const s = useTranslations("search.sections");

  const [keyword, setKeyword] = React.useState(urlState.q);
  React.useEffect(() => {
    setKeyword(urlState.q);
  }, [urlState.q]);

  const sliderMin = Math.max(0, Math.floor(histogram.min / 1000) * 1000);
  const sliderMax = Math.max(
    sliderMin + (offerType === "rent" ? 5000 : 500_000),
    Math.ceil(histogram.max / 1000) * 1000,
  );
  const sliderStep = offerType === "rent" ? 1000 : 100_000;

  function toggleInArray(
    key: "dispozice" | "stav" | "stavba" | "vlastnictvi" | "penb" | "vybaveni",
    value: string,
  ) {
    const current = urlState[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onPatchState({ [key]: next, strana: 1 });
  }

  function parseOptionalInt(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? Math.round(n) : null;
  }

  const showLandArea = !category || category === "house" || category === "land";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        title={t("drawerTitle")}
        description={t("drawerDesc")}
        side="right"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                onClearAll();
                onOpenChange(false);
              }}
            >
              {t("clearFilters")}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (keyword.trim() !== urlState.q) {
                  onPatchState({ q: keyword.trim(), strana: 1 });
                }
                onOpenChange(false);
              }}
            >
              {t("showResults", { count: formatListingCount(totalResults) })}
            </Button>
          </div>
        }
      >
        <div className="space-y-7 pb-4">
          {/* Fulltext */}
          <div className="space-y-2">
            <Input
              label={s("keyword")}
              placeholder={s("keywordPlaceholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onBlur={() => {
                if (keyword.trim() !== urlState.q) {
                  onPatchState({ q: keyword.trim(), strana: 1 });
                }
              }}
            />
          </div>

          {/* Cena */}
          <div className="space-y-3">
            <h3 className="type-small font-semibold text-strong">{s("price")}</h3>
            <RangeSlider
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              histogram={histogram.buckets}
              value={[
                Math.max(sliderMin, urlState.cenaOd ?? sliderMin),
                Math.min(sliderMax, urlState.cenaDo ?? sliderMax),
              ]}
              onValueChange={([lo, hi]) =>
                onPatchState({
                  cenaOd: lo <= sliderMin ? null : lo,
                  cenaDo: hi >= sliderMax ? null : hi,
                  strana: 1,
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={s("from")}
                type="number"
                min={0}
                value={urlState.cenaOd ?? ""}
                onChange={(e) =>
                  onPatchState({ cenaOd: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
              <Input
                label={s("to")}
                type="number"
                min={0}
                value={urlState.cenaDo ?? ""}
                onChange={(e) =>
                  onPatchState({ cenaDo: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
            </div>
          </div>

          {/* Užitná plocha */}
          <div className="space-y-3">
            <h3 className="type-small font-semibold text-strong">{s("usableArea")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={s("from")}
                type="number"
                min={0}
                value={urlState.plochaOd ?? ""}
                onChange={(e) =>
                  onPatchState({ plochaOd: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
              <Input
                label={s("to")}
                type="number"
                min={0}
                value={urlState.plochaDo ?? ""}
                onChange={(e) =>
                  onPatchState({ plochaDo: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
            </div>
          </div>

          {/* Plocha pozemku */}
          {showLandArea ? (
            <div className="space-y-3">
              <h3 className="type-small font-semibold text-strong">{s("landArea")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={s("from")}
                  type="number"
                  min={0}
                  value={urlState.pozemekOd ?? ""}
                  onChange={(e) =>
                    onPatchState({ pozemekOd: parseOptionalInt(e.target.value), strana: 1 })
                  }
                />
                <Input
                  label={s("to")}
                  type="number"
                  min={0}
                  value={urlState.pozemekDo ?? ""}
                  onChange={(e) =>
                    onPatchState({ pozemekDo: parseOptionalInt(e.target.value), strana: 1 })
                  }
                />
              </div>
            </div>
          ) : null}

          {/* Dispozice */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("disposition")}</h3>
            <div className="flex flex-wrap gap-2">
              {DISPOSITIONS.map((d) => (
                <Chip
                  key={d}
                  size="sm"
                  selected={urlState.dispozice.includes(d)}
                  onClick={() => toggleInArray("dispozice", d)}
                >
                  {DISPOSITION_LABELS[d] ?? d}
                </Chip>
              ))}
            </div>
          </div>

          {/* Vybavení */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("amenities")}</h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <Chip
                  key={a}
                  size="sm"
                  selected={urlState.vybaveni.includes(a)}
                  onClick={() => toggleInArray("vybaveni", a)}
                >
                  {AMENITY_LABELS[a] ?? a}
                </Chip>
              ))}
            </div>
          </div>

          {/* Stav */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("condition")}</h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <Chip
                  key={c}
                  size="sm"
                  selected={urlState.stav.includes(c)}
                  onClick={() => toggleInArray("stav", c)}
                >
                  {CONDITION_LABELS[c] ?? c}
                </Chip>
              ))}
            </div>
          </div>

          {/* Typ stavby */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("buildingType")}</h3>
            <div className="flex flex-wrap gap-2">
              {BUILDING_TYPES.map((b) => (
                <Chip
                  key={b}
                  size="sm"
                  selected={urlState.stavba.includes(b)}
                  onClick={() => toggleInArray("stavba", b)}
                >
                  {BUILDING_TYPE_LABELS[b] ?? b}
                </Chip>
              ))}
            </div>
          </div>

          {/* Vlastnictví */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("ownership")}</h3>
            <div className="flex flex-wrap gap-2">
              {OWNERSHIPS.map((o) => (
                <Chip
                  key={o}
                  size="sm"
                  selected={urlState.vlastnictvi.includes(o)}
                  onClick={() => toggleInArray("vlastnictvi", o)}
                >
                  {OWNERSHIP_LABELS[o] ?? o}
                </Chip>
              ))}
            </div>
          </div>

          {/* Patro */}
          <div className="space-y-3">
            <h3 className="type-small font-semibold text-strong">{s("floor")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={s("from")}
                type="number"
                value={urlState.patroOd ?? ""}
                onChange={(e) =>
                  onPatchState({ patroOd: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
              <Input
                label={s("to")}
                type="number"
                value={urlState.patroDo ?? ""}
                onChange={(e) =>
                  onPatchState({ patroDo: parseOptionalInt(e.target.value), strana: 1 })
                }
              />
            </div>
          </div>

          {/* PENB */}
          <div className="space-y-2.5">
            <h3 className="type-small font-semibold text-strong">{s("penb")}</h3>
            <div className="flex flex-wrap gap-2">
              {ENERGY_CLASSES.map((eClass) => (
                <Chip
                  key={eClass}
                  size="sm"
                  selected={urlState.penb.includes(eClass)}
                  onClick={() => toggleInArray("penb", eClass)}
                >
                  {eClass}
                </Chip>
              ))}
            </div>
          </div>

          {/* Vybavenost & Stáří */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={s("furnished")}
              value={urlState.vybaveno ?? "any"}
              onValueChange={(val) =>
                onPatchState({ vybaveno: val === "any" ? null : val, strana: 1 })
              }
              options={[
                { value: "any", label: s("furnishedAny") },
                { value: "yes", label: "Vybaveno" },
                { value: "partly", label: "Částečně vybaveno" },
                { value: "no", label: "Nevybaveno" },
              ]}
            />
            <Select
              label={s("age")}
              value={urlState.stari !== null ? String(urlState.stari) : "any"}
              onValueChange={(val) =>
                onPatchState({ stari: val === "any" ? null : Number(val), strana: 1 })
              }
              options={[
                { value: "any", label: s("ageAny") },
                { value: "1", label: s("age1") },
                { value: "7", label: s("age7") },
                { value: "30", label: s("age30") },
              ]}
            />
          </div>

          {/* Dostupné od */}
          <Input
            label={s("availableFrom")}
            type="date"
            value={urlState.od ?? ""}
            onChange={(e) => onPatchState({ od: e.target.value || null, strana: 1 })}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
