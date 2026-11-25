import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listing/ListingCard";
import { Breadcrumbs } from "@/components/ui";
import { searchListings } from "@/db/queries/listings";
import { getLocationByShortOrFullSlug } from "@/db/queries/locations";
import { CATEGORY_URL_TO_ENUM } from "@/lib/search/schema";
import { CATEGORY_LABELS, formatListingCount } from "@/lib/format";

export async function renderListingStubPage(params: {
  offerType: "sale" | "rent";
  categorySlug: string;
  lokalita?: string[];
}) {
  if (!(params.categorySlug in CATEGORY_URL_TO_ENUM)) {
    notFound();
  }
  const category = CATEGORY_URL_TO_ENUM[params.categorySlug];
  const locPath = params.lokalita && params.lokalita.length > 0 ? params.lokalita.join("/") : null;
  const location = locPath ? await getLocationByShortOrFullSlug(locPath) : null;

  const result = await searchListings({
    offerType: params.offerType,
    category,
    locations: location ? [location.fullSlug] : locPath ? [locPath] : [],
    page: 1,
    pageSize: 24,
  });

  const offerTitle = params.offerType === "sale" ? "Prodej" : "Pronájem";
  const categoryTitle = (category ? CATEGORY_LABELS[category] : undefined) ?? "nemovitostí";
  const heading = location
    ? `${offerTitle} – ${categoryTitle}, ${location.name}`
    : `${offerTitle} – ${categoryTitle}`;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Úvod", href: "/" },
          {
            label: offerTitle,
            href: `/${params.offerType === "sale" ? "prodej" : "pronajem"}/vse`,
          },
          { label: location ? `${categoryTitle} · ${location.name}` : categoryTitle },
        ]}
      />
      <div className="space-y-1">
        <h1 className="type-h1 text-strong">{heading}</h1>
        <p className="type-body text-muted tnum">{formatListingCount(result.total)}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {result.items.map((item, idx) => (
          <ListingCard key={item.id} listing={item} priority={idx < 2} />
        ))}
      </div>
    </main>
  );
}
