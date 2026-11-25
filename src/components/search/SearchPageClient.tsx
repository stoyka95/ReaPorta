"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import type { PriceHistogramResult, SearchListingsResult } from "@/db/queries/listings";
import { Breadcrumbs } from "@/components/ui";
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
  initialUrlState,
}: SearchPageClientProps) {
  const router = useRouter();
  const [urlState, setUrlState] = useQueryStates(searchUrlParsers, {
    history: "push",
    shallow: true,
    scroll: false,
  });

  const [results, setResults] = React.useState<SearchListingsResult>(initialResults);
  const [histogram, setHistogram] = React.useState<PriceHistogramResult>(initialHistogram);
  const [loading, setLoading] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);

  const resultsTopRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);
  const previousQueryKey = React.useRef(
    buildApiQueryString({ offerType, category, pathLocationSlug }, initialUrlState),
  );

  // Sync SSR initial results when route params (offer/category/pathLocation) change
  React.useEffect(() => {
    setResults(initialResults);
    setHistogram(initialHistogram);
  }, [initialResults, initialHistogram]);

  const currentQueryKey = buildApiQueryString(
    { offerType, category, pathLocationSlug },
    urlState as UrlFilterState,
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

    fetch(`/api/search?${currentQueryKey}`, { signal: controller.signal })
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
      )
      .catch(() => {
        // Zrušeno novějším dotazem
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentQueryKey]);

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

  const activeFilterCount = countActiveFilters(urlState as UrlFilterState);

  return (
    <div className="min-h-dvh">
      <FilterBar
        offerType={offerType}
        category={category}
        pathLocationName={pathLocationName}
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

      <main
        ref={resultsTopRef}
        className="mx-auto max-w-[1536px] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <Breadcrumbs items={breadcrumbs} />

        <ResultsList
          heading={heading}
          results={results}
          loading={loading}
          urlState={urlState as UrlFilterState}
          highlightedId={highlightedId}
          onHoverListing={setHighlightedId}
          onSortChange={(sort: SortOption) => void setUrlState({ razeni: sort, strana: 1 })}
          onViewChange={(view: ViewMode) => void setUrlState({ zobrazeni: view })}
          onPageChange={handlePageChange}
          onPatchState={handlePatchState}
          onClearAll={handleClearAll}
        />
      </main>
    </div>
  );
}
