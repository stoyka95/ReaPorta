"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Map as MapIcon, List as ListIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import type { MapPoint, PriceHistogramResult, SearchListingsResult } from "@/db/queries/listings";
import { DynamicMapView } from "@/components/map/DynamicMapView";
import { Breadcrumbs, Button } from "@/components/ui";
import {
  CATEGORY_ENUM_TO_URL,
  OFFER_ENUM_TO_URL,
  type ListingCategory,
  type OfferType,
  type SortOption,
} from "@/lib/search/schema";
import {
  buildApiQueryString,
  countActiveFilters,
  searchUrlParsers,
  type UrlFilterState,
  type ViewMode,
} from "@/lib/search/url-params";
import { cn } from "@/lib/cn";
import { FilterBar } from "./FilterBar";
import { FilterDrawer } from "./FilterDrawer";
import { ResultsList } from "./ResultsList";

export interface SearchPageClientProps {
  offerType: OfferType;
  category?: ListingCategory;
  pathLocationSlug: string | null;
  pathLocationName: string | null;
  heading: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  initialResults: SearchListingsResult;
  initialHistogram: PriceHistogramResult;
  initialMapPoints: MapPoint[];
  initialUrlState: UrlFilterState;
}

export function SearchPageClient({
  offerType,
  category,
  pathLocationSlug,
  pathLocationName,
  heading,
  breadcrumbs,
  initialResults,
  initialHistogram,
  initialMapPoints,
  initialUrlState,
}: SearchPageClientProps) {
  const router = useRouter();
  const tMap = useTranslations("map");
  const [urlState, setUrlState] = useQueryStates(searchUrlParsers, {
    history: "push",
    shallow: true,
    scroll: false,
  });

  const [results, setResults] = React.useState<SearchListingsResult>(initialResults);
  const [histogram, setHistogram] = React.useState<PriceHistogramResult>(initialHistogram);
  const [mapPoints, setMapPoints] = React.useState<MapPoint[]>(initialMapPoints);
  const [loading, setLoading] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  const [showDesktopMap, setShowDesktopMap] = React.useState(true);
  const [mobileMapOpen, setMobileMapOpen] = React.useState(false);
  const [searchOnMove, setSearchOnMove] = React.useState(Boolean(initialUrlState.bbox));

  const resultsTopRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);
  const previousQueryKey = React.useRef(
    buildApiQueryString({ offerType, category, pathLocationSlug }, initialUrlState),
  );

  React.useEffect(() => {
    setResults(initialResults);
    setHistogram(initialHistogram);
    setMapPoints(initialMapPoints);
  }, [initialResults, initialHistogram, initialMapPoints]);

  const currentQueryKey = buildApiQueryString(
    { offerType, category, pathLocationSlug },
    urlState as UrlFilterState,
  );

  // For map points we omit pagination & sort, and when searching without bbox we keep all matching pins
  const mapQueryKey = buildApiQueryString(
    { offerType, category, pathLocationSlug },
    {
      ...(urlState as UrlFilterState),
      strana: 1,
      razeni: "newest",
    },
  );
  const previousMapKey = React.useRef(
    buildApiQueryString(
      { offerType, category, pathLocationSlug },
      { ...initialUrlState, strana: 1, razeni: "newest" },
    ),
  );

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (currentQueryKey === previousQueryKey.current) {
      return;
    }
    previousQueryKey.current = currentQueryKey;

    const controller = new AbortController();
    setLoading(true);

    const shouldFetchMap = mapQueryKey !== previousMapKey.current;
    if (shouldFetchMap) {
      previousMapKey.current = mapQueryKey;
    }

    const searchPromise = fetch(`/api/search?${currentQueryKey}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("search_failed"))))
      .then(
        (
          data: SearchListingsResult & {
            histogram: PriceHistogramResult;
          },
        ) => {
          setResults({
            items: data.items,
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            totalPages: data.totalPages,
          });
          if (data.histogram) {
            setHistogram(data.histogram);
          }
        },
      );

    const mapPromise = shouldFetchMap
      ? fetch(`/api/search/map?${mapQueryKey}`, { signal: controller.signal })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error("map_failed"))))
          .then((data: { points: MapPoint[] }) => {
            setMapPoints(data.points);
          })
      : Promise.resolve();

    Promise.all([searchPromise, mapPromise])
      .catch(() => {
        // Zrušeno novějším dotazem
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentQueryKey, mapQueryKey]);

  const categorySlug = category ? CATEGORY_ENUM_TO_URL[category] : "vse";
  const locPathSuffix = pathLocationSlug ? `/${pathLocationSlug}` : "";

  function currentQueryParamsWithoutPage(): string {
    const sp = new URLSearchParams(window.location.search);
    sp.delete("strana");
    const s = sp.toString();
    return s ? `?${s}` : "";
  }

  function handleOfferChange(nextOffer: OfferType) {
    const nextPath = `/${OFFER_ENUM_TO_URL[nextOffer]}/${categorySlug}${locPathSuffix}${currentQueryParamsWithoutPage()}`;
    router.push(nextPath);
  }

  function handleCategoryChange(nextCategorySlug: string) {
    const nextPath = `/${OFFER_ENUM_TO_URL[offerType]}/${nextCategorySlug}${locPathSuffix}${currentQueryParamsWithoutPage()}`;
    router.push(nextPath);
  }

  function handleAddLocation(fullSlug: string) {
    if (!pathLocationSlug) {
      const nextPath = `/${OFFER_ENUM_TO_URL[offerType]}/${categorySlug}/${fullSlug}${currentQueryParamsWithoutPage()}`;
      router.push(nextPath);
      return;
    }
    if (fullSlug === pathLocationSlug || urlState.loc.includes(fullSlug)) return;
    void setUrlState({ loc: [...urlState.loc, fullSlug], strana: 1 });
  }

  function handleRemovePathLocation() {
    const nextPath = `/${OFFER_ENUM_TO_URL[offerType]}/${categorySlug}${currentQueryParamsWithoutPage()}`;
    router.push(nextPath);
  }

  function handlePatchState(patch: Partial<UrlFilterState>) {
    void setUrlState(patch);
  }

  function handleClearAll() {
    setSearchOnMove(false);
    void setUrlState({
      loc: [],
      cenaOd: null,
      cenaDo: null,
      plochaOd: null,
      plochaDo: null,
      pozemekOd: null,
      pozemekDo: null,
      dispozice: [],
      stav: [],
      stavba: [],
      vlastnictvi: [],
      patroOd: null,
      patroDo: null,
      penb: [],
      vybaveni: [],
      vybaveno: null,
      od: null,
      stari: null,
      q: "",
      bbox: null,
      strana: 1,
    });
  }

  function handlePageChange(nextPage: number) {
    void setUrlState({ strana: nextPage });
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleBboxChange(nextBbox: string) {
    void setUrlState({ bbox: nextBbox, strana: 1 });
  }

  const activeFilterCount = countActiveFilters(urlState as UrlFilterState);

  return (
    <div className="min-h-dvh">
      <FilterBar
        offerType={offerType}
        category={category}
        pathLocationName={pathLocationName}
        pathLocationFullSlug={pathLocationSlug}
        urlState={urlState as UrlFilterState}
        activeFilterCount={activeFilterCount}
        histogram={histogram}
        onOfferChange={handleOfferChange}
        onCategoryChange={handleCategoryChange}
        onAddLocation={handleAddLocation}
        onRemovePathLocation={handleRemovePathLocation}
        onPatchState={handlePatchState}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        offerType={offerType}
        category={category}
        urlState={urlState as UrlFilterState}
        totalResults={results.total}
        histogram={histogram}
        onPatchState={handlePatchState}
        onClearAll={handleClearAll}
      />

      <main ref={resultsTopRef} className="mx-auto max-w-[1536px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Breadcrumbs items={breadcrumbs} />
          <div className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<MapIcon className="h-4 w-4" strokeWidth={1.75} />}
              onClick={() => setShowDesktopMap((prev) => !prev)}
            >
              {showDesktopMap ? tMap("hideMap") : tMap("showMap")}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid gap-6",
            showDesktopMap ? "lg:grid-cols-[55%_1fr] lg:items-start" : "grid-cols-1",
          )}
        >
          {/* Levý sloupec: výpis */}
          <div className="min-w-0">
            <ResultsList
              heading={heading}
              results={results}
              loading={loading}
              urlState={urlState as UrlFilterState}
              splitMode={showDesktopMap}
              highlightedId={highlightedId}
              onHoverListing={setHighlightedId}
              onSortChange={(sort: SortOption) => void setUrlState({ razeni: sort, strana: 1 })}
              onViewChange={(view: ViewMode) => void setUrlState({ zobrazeni: view })}
              onPageChange={handlePageChange}
              onPatchState={handlePatchState}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Pravý sloupec: sticky mapa na desktopu (≥ 1024 px) */}
          {showDesktopMap ? (
            <aside
              aria-label="Mapa nabídek"
              className="sticky top-36 hidden h-[calc(100dvh-10rem)] min-h-96 lg:block"
            >
              <DynamicMapView
                points={mapPoints}
                highlightedId={highlightedId}
                onHoverListing={setHighlightedId}
                searchOnMove={searchOnMove}
                onSearchOnMoveChange={(enabled) => {
                  setSearchOnMove(enabled);
                  if (!enabled && urlState.bbox) {
                    void setUrlState({ bbox: null, strana: 1 });
                  }
                }}
                onBboxChange={handleBboxChange}
                initialBbox={urlState.bbox}
              />
            </aside>
          ) : null}
        </div>
      </main>

      {/* Mobilní plovoucí skleněné tlačítko Mapa (DESIGN.md kap. 7) */}
      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMapOpen(true)}
          className="glass-3 inline-flex h-12 items-center gap-2 rounded-pill px-6 type-small font-semibold text-strong shadow-4 transition-transform duration-150 hover:scale-105 cursor-pointer"
        >
          <MapIcon className="h-4.5 w-4.5 text-accent-text" strokeWidth={2} aria-hidden="true" />
          <span>{tMap("openMap")}</span>
        </button>
      </div>

      {/* Mobilní celoobrazovková mapa s bottom sheetem (AC-3.1, QA A12) */}
      {mobileMapOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mapa nemovitostí"
          className="fixed inset-0 z-50 flex flex-col bg-page lg:hidden"
        >
          <div className="flex-1 p-2">
            <DynamicMapView
              points={mapPoints}
              highlightedId={highlightedId}
              onHoverListing={setHighlightedId}
              searchOnMove={searchOnMove}
              onSearchOnMoveChange={(enabled) => {
                setSearchOnMove(enabled);
                if (!enabled && urlState.bbox) {
                  void setUrlState({ bbox: null, strana: 1 });
                }
              }}
              onBboxChange={handleBboxChange}
              initialBbox={urlState.bbox}
              isMobileSheet={true}
            />
          </div>
          <div className="border-t border-line bg-surface p-3 flex justify-center">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ListIcon className="h-4 w-4" />}
              onClick={() => setMobileMapOpen(false)}
            >
              {tMap("closeMap")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
