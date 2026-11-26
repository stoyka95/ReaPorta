import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Trees,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BRAND } from "@/config/brand";
import { getListingBySlug, getSimilarListings } from "@/db/queries/listings";
import { ListingGallery } from "@/components/listing/ListingGallery";
import { ContactCard } from "@/components/listing/ContactCard";
import { MortgageCalculator } from "@/components/listing/MortgageCalculator";
import { ReportListingDialog } from "@/components/listing/ReportListingDialog";
import { MobileContactBar } from "@/components/listing/MobileContactBar";
import { ListingCard } from "@/components/listing/ListingCard";
import { DynamicListingLocationMap } from "@/components/map/DynamicListingLocationMap";
import { Badge, Breadcrumbs, Card, PenbBadge } from "@/components/ui";
import {
  AMENITY_LABELS,
  BUILDING_TYPE_LABELS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  DISPOSITION_LABELS,
  formatArea,
  formatDate,
  formatFloor,
  formatPrice,
  formatPricePerM2,
  FURNISHED_LABELS,
  nbsp,
  OFFER_LABELS,
  OWNERSHIP_LABELS,
} from "@/lib/format";
import { CATEGORY_ENUM_TO_URL, OFFER_ENUM_TO_URL } from "@/lib/search/schema";

export const revalidate = 60;

const PUBLIC_VISIBLE_STATUSES = new Set(["active", "sold", "expired", "paused"]);

interface DetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing || !PUBLIC_VISIBLE_STATUSES.has(listing.status)) {
    return { title: "Nabídka nenalezena" };
  }

  const priceText = formatPrice(listing.price, listing.priceUnit, {
    priceOnRequest: listing.priceOnRequest,
  });
  const description = `${listing.title} · ${priceText}. ${listing.description.slice(0, 140)}…`;

  return {
    title: `${listing.title} — ${priceText}`,
    description,
    alternates: {
      canonical: `/nemovitost/${listing.slug}`,
    },
    openGraph: {
      type: "website",
      locale: "cs_CZ",
      siteName: BRAND.name,
      title: `${listing.title} — ${priceText}`,
      description,
      url: `/nemovitost/${listing.slug}`,
    },
    robots:
      listing.status === "active" ? { index: true, follow: true } : { index: false, follow: true },
  };
}

import { getSessionUser } from "@/lib/auth/session";

export default async function ListingDetailPage({ params }: DetailPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  if (!PUBLIC_VISIBLE_STATUSES.has(listing.status)) {
    const viewer = await getSessionUser();
    const canPreview =
      viewer !== null && (viewer.role === "admin" || viewer.id === listing.agentId);
    if (!canPreview) {
      notFound();
    }
  }

  const t = await getTranslations("detail");
  const similarListings = await getSimilarListings({
    excludeId: listing.id,
    offerType: listing.offerType,
    category: listing.category,
    city: listing.city,
    price: listing.price,
    limit: 4,
  });

  const isInactive = listing.status !== "active";
  const priceText = formatPrice(listing.price, listing.priceUnit, {
    priceOnRequest: listing.priceOnRequest,
  });
  const perM2Text =
    listing.offerType === "sale" && !listing.priceOnRequest
      ? formatPricePerM2(listing.pricePerM2)
      : null;

  const offerUrl = OFFER_ENUM_TO_URL[listing.offerType];
  const categoryUrl = CATEGORY_ENUM_TO_URL[listing.category];
  const locationDisplay = listing.district ?? listing.city;
  const addressLine =
    listing.showExactLocation && listing.street
      ? `${listing.street}${listing.houseNumber ? ` ${listing.houseNumber}` : ""}, ${locationDisplay}`
      : locationDisplay;

  const keyFacts: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
  if (listing.disposition) {
    keyFacts.push({
      icon: <Building2 className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Dispozice",
      value: DISPOSITION_LABELS[listing.disposition] ?? listing.disposition,
    });
  }
  if (listing.usableArea) {
    keyFacts.push({
      icon: <Maximize2 className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Užitná plocha",
      value: formatArea(listing.usableArea) ?? "",
    });
  }
  if (listing.landArea && listing.category !== "flat") {
    keyFacts.push({
      icon: <Trees className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Plocha pozemku",
      value: formatArea(listing.landArea) ?? "",
    });
  }
  const floorLabel = formatFloor(listing.floor, listing.floorsTotal);
  if (floorLabel) {
    keyFacts.push({
      icon: <Layers className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Podlaží",
      value: floorLabel,
    });
  }
  if (listing.condition) {
    keyFacts.push({
      icon: <Compass className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Stav",
      value: CONDITION_LABELS[listing.condition] ?? listing.condition,
    });
  }
  if (listing.yearBuilt) {
    keyFacts.push({
      icon: <Calendar className="h-5 w-5 text-accent-text" strokeWidth={1.75} />,
      label: "Rok výstavby",
      value: String(listing.yearBuilt),
    });
  }

  const parameterPairs: Array<{ label: string; value: string }> = [
    { label: "Typ nabídky", value: OFFER_LABELS[listing.offerType] ?? listing.offerType },
    { label: "Kategorie", value: CATEGORY_LABELS[listing.category] ?? listing.category },
  ];
  if (listing.subtype) parameterPairs.push({ label: "Podtyp", value: listing.subtype });
  if (listing.disposition) {
    parameterPairs.push({
      label: "Dispozice",
      value: DISPOSITION_LABELS[listing.disposition] ?? listing.disposition,
    });
  }
  if (listing.usableArea) {
    parameterPairs.push({ label: "Užitná plocha", value: formatArea(listing.usableArea) ?? "" });
  }
  if (listing.builtArea) {
    parameterPairs.push({ label: "Zastavěná plocha", value: formatArea(listing.builtArea) ?? "" });
  }
  if (listing.landArea) {
    parameterPairs.push({ label: "Plocha pozemku", value: formatArea(listing.landArea) ?? "" });
  }
  if (floorLabel) parameterPairs.push({ label: "Patro", value: floorLabel });
  if (listing.buildingType) {
    parameterPairs.push({
      label: "Typ stavby",
      value: BUILDING_TYPE_LABELS[listing.buildingType] ?? listing.buildingType,
    });
  }
  if (listing.condition) {
    parameterPairs.push({
      label: "Stav objektu",
      value: CONDITION_LABELS[listing.condition] ?? listing.condition,
    });
  }
  if (listing.ownership) {
    parameterPairs.push({
      label: "Vlastnictví",
      value: OWNERSHIP_LABELS[listing.ownership] ?? listing.ownership,
    });
  }
  if (listing.furnished) {
    parameterPairs.push({
      label: "Vybavenost",
      value: FURNISHED_LABELS[listing.furnished] ?? listing.furnished,
    });
  }
  if (listing.yearBuilt) {
    parameterPairs.push({ label: "Rok výstavby", value: String(listing.yearBuilt) });
  }
  if (listing.lastRenovation) {
    parameterPairs.push({ label: "Rok rekonstrukce", value: String(listing.lastRenovation) });
  }
  if (listing.availableFrom) {
    parameterPairs.push({ label: "Volné od", value: formatDate(listing.availableFrom) });
  }
  if (listing.publishedAt) {
    parameterPairs.push({ label: "Zveřejněno", value: formatDate(listing.publishedAt) });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: `${appUrl}/nemovitost/${listing.slug}`,
    datePosted: listing.publishedAt?.toISOString(),
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressRegion: listing.district ?? listing.city,
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    },
    ...(listing.price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: listing.price,
            priceCurrency: "CZK",
            availability:
              listing.status === "active"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        }
      : {}),
  };

  const descriptionParagraphs = listing.description
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-16">
      {/* JSON-LD strukturovaná data (AC-4.9) */}
      <script
        type="application/ld+json"
        // Bezpečná serializace vlastního JSON-LD objektu s escapováním '<'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
        }}
      />

      {/* Drobečková navigace */}
      <Breadcrumbs
        items={[
          { label: "Úvod", href: "/" },
          { label: OFFER_LABELS[listing.offerType] ?? "Nabídky", href: `/${offerUrl}/vse` },
          {
            label: CATEGORY_LABELS[listing.category] ?? "Nemovitosti",
            href: `/${offerUrl}/${categoryUrl}`,
          },
          { label: locationDisplay },
        ]}
      />

      {/* Upozornění pro neaktivní nabídku (sold / expired / paused — AC-4.10, QA A17) */}
      {isInactive ? (
        <div
          role="alert"
          data-inactive-banner="true"
          className="flex items-start gap-3 rounded-xl border border-line bg-warning-bg p-5 text-warning"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          <div className="space-y-1">
            <p className="type-body font-semibold">
              {listing.status === "sold" ? t("inactiveSold") : t("inactiveExpired")}
            </p>
            <p className="type-small text-body">{t("inactiveNote")}</p>
          </div>
        </div>
      ) : null}

      {/* 1. Mozaiková galerie + Lightbox (AC-4.1) */}
      <ListingGallery
        title={listing.title}
        images={listing.images.map((img) => ({
          id: img.id,
          storageKey: img.storageKey,
          blurDataUrl: img.blurDataUrl,
          alt: img.alt,
        }))}
      />

      {/* 2. Dva sloupce: obsah vlevo, sticky kontaktní karta vpravo (DESIGN.md kap. 7) */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          {/* Hlavička s cenou */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{OFFER_LABELS[listing.offerType]}</Badge>
              <Badge variant="neutral">{CATEGORY_LABELS[listing.category]}</Badge>
              <PenbBadge energyClass={listing.energyClass} />
              {listing.priceNegotiable ? <Badge variant="new">K jednání</Badge> : null}
            </div>

            <h1 className="type-h1 text-strong">{nbsp(listing.title)}</h1>

            <p className="flex items-center gap-1.5 type-body text-muted">
              <MapPin
                className="h-4.5 w-4.5 shrink-0 text-accent-text"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>{addressLine}</span>
            </p>

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 pt-1">
              <p className="type-price-xl text-strong">{priceText}</p>
              {perM2Text ? <p className="type-body text-muted tnum">{perM2Text}</p> : null}
            </div>

            {listing.offerType === "rent" && (listing.feesMonthly || listing.deposit) ? (
              <div className="flex flex-wrap gap-6 rounded-xl border border-line-subtle bg-surface px-4 py-3 type-small text-body">
                {listing.feesMonthly ? (
                  <span>
                    <span className="text-muted">{t("feesMonthly")}:</span>{" "}
                    <strong className="font-semibold text-strong tnum">
                      {formatPrice(listing.feesMonthly, "per_month")}
                    </strong>
                  </span>
                ) : null}
                {listing.deposit ? (
                  <span>
                    <span className="text-muted">{t("deposit")}:</span>{" "}
                    <strong className="font-semibold text-strong tnum">
                      {formatPrice(listing.deposit)}
                    </strong>
                  </span>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* 3. Pruh klíčových faktů (AC-4.2) */}
          {keyFacts.length > 0 ? (
            <section aria-labelledby="sec-facts">
              <h2 id="sec-facts" className="sr-only">
                {t("keyFacts")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {keyFacts.slice(0, 6).map((fact) => (
                  <Card key={fact.label} padding="md" className="flex items-center gap-3.5">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100"
                      aria-hidden="true"
                    >
                      {fact.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="type-caption text-muted">{fact.label}</p>
                      <p className="truncate type-body font-semibold text-strong tnum">
                        {fact.value}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {/* 4. Popis nemovitosti (čistý text, žádné HTML) */}
          <Card padding="lg" className="space-y-4">
            <h2 className="type-h3 text-strong">{t("description")}</h2>
            <div className="space-y-4">
              {descriptionParagraphs.map((para, idx) => (
                <p key={idx} className="max-w-[68ch] type-body text-body">
                  {nbsp(para)}
                </p>
              ))}
            </div>
          </Card>

          {/* 5. Tabulka parametrů (dvousloupcový <dl>) */}
          <Card padding="lg" className="space-y-4">
            <h2 className="type-h3 text-strong">{t("parameters")}</h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {parameterPairs.map((pair) => (
                <div
                  key={pair.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line-subtle pb-2.5"
                >
                  <dt className="type-small text-muted">{pair.label}</dt>
                  <dd className="type-small font-medium text-strong text-right tnum">
                    {pair.value}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-b border-line-subtle pb-2.5">
                <dt className="type-small text-muted">Energetická třída</dt>
                <dd>
                  <PenbBadge energyClass={listing.energyClass} />
                </dd>
              </div>
            </dl>
          </Card>

          {/* 6. Vybavení */}
          {listing.amenities.length > 0 ? (
            <Card padding="lg" className="space-y-4">
              <h2 className="type-h3 text-strong">{t("amenities")}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listing.amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2.5 type-small font-medium text-strong"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-pill bg-violet-100 text-accent-text">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <span>{AMENITY_LABELS[a] ?? a}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Historie ceny (pokud existuje) */}
          {listing.priceHistory.length > 1 ? (
            <Card padding="lg" className="space-y-3">
              <h2 className="type-h3 text-strong">{t("priceHistory")}</h2>
              <ul className="space-y-2">
                {listing.priceHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between border-b border-line-subtle pb-2 type-small"
                  >
                    <span className="text-muted tnum">{formatDate(entry.changedAt)}</span>
                    <span className="font-semibold text-strong tnum">
                      {formatPrice(entry.price, listing.priceUnit)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* 7. Mapa polohy (přesný bod nebo ~300m kruh dle AC-3.4 / QA A19) */}
          <Card padding="lg" className="space-y-4">
            <h2 className="type-h3 text-strong">{t("location")}</h2>
            {!listing.showExactLocation ? (
              <p className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 type-small text-violet-800">
                {t("approxLocationBanner")}
              </p>
            ) : null}
            <DynamicListingLocationMap
              lat={listing.lat}
              lng={listing.lng}
              showExactLocation={listing.showExactLocation}
              label={locationDisplay}
            />
          </Card>

          {/* 8. Hypoteční kalkulačka (u prodeje — AC-4.6, QA A16) */}
          {listing.offerType === "sale" ? (
            <MortgageCalculator initialPrice={listing.price ?? 5_000_000} />
          ) : null}

          {/* Nahlásit inzerát (AC-4.8) */}
          <div className="flex items-center justify-between rounded-xl border border-line-subtle bg-surface px-5 py-3.5">
            <span className="type-small text-muted">
              Všimli jste si nepřesnosti v popisu nebo ceně?
            </span>
            <ReportListingDialog listingId={listing.id} />
          </div>
        </div>

        {/* Sticky kontaktní karta na desktopu */}
        <aside className="lg:sticky lg:top-24">
          <ContactCard
            listingId={listing.id}
            listingTitle={listing.title}
            agent={listing.agent}
            agency={listing.agency}
            disabled={isInactive}
          />
        </aside>
      </div>

      {/* 9. Podobné nabídky (AC-4.7) */}
      {similarListings.length > 0 ? (
        <section aria-labelledby="sec-similar" className="space-y-6 pt-6">
          <h2 id="sec-similar" className="type-h2 text-strong">
            {t("similarTitle")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similarListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Mobilní lepicí spodní lišta (DESIGN.md kap. 7) */}
      <MobileContactBar priceText={priceText} />
    </div>
  );
}
