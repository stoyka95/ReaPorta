import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchPageClient } from "@/components/search/SearchPageClient";
import { getPriceHistogram, searchListings } from "@/db/queries/listings";
import { getLocationByShortOrFullSlug } from "@/db/queries/locations";
import { CATEGORY_LABELS } from "@/lib/format";
import { CATEGORY_URL_TO_ENUM, OFFER_ENUM_TO_URL, type OfferType } from "@/lib/search/schema";
import {
  buildFiltersFromUrlState,
  countActiveFilters,
  parseRawSearchParamsToUrlState,
} from "@/lib/search/url-params";

export async function generateSearchMetadata(params: {
  offerType: OfferType;
  categorySlug: string;
  lokalita?: string[];
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  if (!(params.categorySlug in CATEGORY_URL_TO_ENUM)) {
    return { title: "Nenalezeno" };
  }
  const category = CATEGORY_URL_TO_ENUM[params.categorySlug];
  const locPath = params.lokalita && params.lokalita.length > 0 ? params.lokalita.join("/") : null;
  const location = locPath ? await getLocationByShortOrFullSlug(locPath) : null;
  const urlState = parseRawSearchParamsToUrlState(params.searchParams);
  const filterCount = countActiveFilters(urlState);

  const offerTitle = params.offerType === "sale" ? "Prodej" : "Pronájem";
  const categoryTitle = (category ? CATEGORY_LABELS[category] : undefined) ?? "nemovitostí";
  const title = location
    ? `${offerTitle} – ${categoryTitle}, ${location.name}`
    : `${offerTitle} – ${categoryTitle}`;

  const canonicalPath = `/${OFFER_ENUM_TO_URL[params.offerType]}/${params.categorySlug}${
    location ? `/${location.fullSlug}` : ""
  }`;

  return {
    title,
    description: `Aktuální nabídky: ${title.toLowerCase()} na portálu ReaPorta. Přehledné filtry, přesné parametry a interaktivní mapa.`,
    alternates: { canonical: canonicalPath },
    robots: filterCount > 2 ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export async function renderSearchPage(params: {
  offerType: OfferType;
  categorySlug: string;
  lokalita?: string[];
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!(params.categorySlug in CATEGORY_URL_TO_ENUM)) {
    notFound();
  }

  const category = CATEGORY_URL_TO_ENUM[params.categorySlug];
  const locPath = params.lokalita && params.lokalita.length > 0 ? params.lokalita.join("/") : null;
  const location = locPath ? await getLocationByShortOrFullSlug(locPath) : null;

  const initialUrlState = parseRawSearchParamsToUrlState(params.searchParams);
  const filters = buildFiltersFromUrlState(
    {
      offerType: params.offerType,
      category,
      pathLocationSlug: location ? location.fullSlug : locPath,
    },
    initialUrlState,
  );

  const [initialResults, initialHistogram] = await Promise.all([
    searchListings(filters),
    getPriceHistogram(filters),
  ]);

  const offerTitle = params.offerType === "sale" ? "Prodej" : "Pronájem";
  const categoryTitle = (category ? CATEGORY_LABELS[category] : undefined) ?? "nemovitostí";
  const heading = location
    ? `${offerTitle} – ${categoryTitle}, ${location.name}`
    : `${offerTitle} – ${categoryTitle}`;

  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: "Úvod", href: "/" },
    { label: offerTitle, href: `/${OFFER_ENUM_TO_URL[params.offerType]}/vse` },
  ];
  if (category) {
    breadcrumbs.push({
      label: categoryTitle,
      href: location ? `/${OFFER_ENUM_TO_URL[params.offerType]}/${params.categorySlug}` : undefined,
    });
  }
  if (location) {
    breadcrumbs.push({ label: location.name });
  }

  return (
    <SearchPageClient
      offerType={params.offerType}
      category={category}
      pathLocationSlug={location ? location.fullSlug : locPath}
      pathLocationName={location ? location.name : null}
      heading={heading}
      breadcrumbs={breadcrumbs}
      initialResults={initialResults}
      initialHistogram={initialHistogram}
      initialUrlState={initialUrlState}
    />
  );
}
