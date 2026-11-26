import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Car, Home, Store, Trees } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { HeroSearchPanel } from "@/components/home/HeroSearchPanel";
import { ListingCard } from "@/components/listing/ListingCard";
import { Button, GlassPanel } from "@/components/ui";
import { BRAND } from "@/config/brand";
import { getFeaturedAndNewListings, getPortalStats } from "@/db/queries/listings";
import { getPopularCities } from "@/db/queries/locations";
import { formatListingCount, formatNumber, nbsp } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const CITY_BACKDROPS = [
  "/media/pool/exterior-01-card.webp",
  "/media/pool/exterior-03-card.webp",
  "/media/pool/house-02-card.webp",
  "/media/pool/exterior-04-card.webp",
  "/media/pool/house-01-card.webp",
  "/media/pool/exterior-05-card.webp",
  "/media/pool/house-03-card.webp",
  "/media/pool/exterior-02-card.webp",
];

export default async function HomePage() {
  const t = await getTranslations("home");
  const [{ newest, featured }, popularCities, stats] = await Promise.all([
    getFeaturedAndNewListings(),
    getPopularCities(),
    getPortalStats(),
  ]);

  const categories = [
    { key: "flat", href: "/prodej/byty", icon: Building2 },
    { key: "house", href: "/prodej/domy", icon: Home },
    { key: "land", href: "/prodej/pozemky", icon: Trees },
    { key: "commercial", href: "/prodej/komercni", icon: Store },
    { key: "other", href: "/prodej/ostatni", icon: Car },
  ] as const;

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: BRAND.name,
        url: baseUrl,
        logo: `${baseUrl}/brand/icon-512.png`,
        email: BRAND.email,
      },
      {
        "@type": "WebSite",
        name: BRAND.name,
        url: baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/prodej/vse?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 pt-8 pb-8 sm:px-6 lg:space-y-24 lg:px-8 lg:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero sekce */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="type-eyebrow text-accent-text">{t("eyebrow")}</p>
            <h1 className="type-display text-strong max-w-2xl">{nbsp(t("heroTitle"))}</h1>
            <p className="type-body-lg max-w-xl text-body">{nbsp(t("heroSubtitle"))}</p>
          </div>
          <HeroSearchPanel />
        </div>

        {/* Architektonický okenní výřez na desktopu */}
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-float lg:block">
          <Image
            src="/media/pool/living-01-full.webp"
            alt="Světlý interiér moderního bytu"
            fill
            priority
            sizes="(max-width: 1280px) 38vw, 440px"
            className="object-cover"
          />
          <div className="scrim-photo absolute inset-0" aria-hidden="true" />
          <div className="absolute right-5 bottom-5 left-5">
            <GlassPanel
              level={2}
              padding="sm"
              radius="xl"
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="type-caption text-muted">{t("heroHighlightLabel")}</p>
                <p className="type-h3 text-strong tnum">
                  {formatListingCount(stats.activeListings)}
                </p>
              </div>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/prodej/vse">
                  <span>{t("viewAll")}</span>
                </Link>
              </Button>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* 2. Rychlé dlaždice kategorií (AC-1.2) */}
      <section aria-labelledby="sec-categories" className="space-y-6">
        <div className="space-y-1">
          <p className="type-eyebrow text-muted">{t("categoriesEyebrow")}</p>
          <h2 id="sec-categories" className="type-h2 text-strong">
            {t("categoriesTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {categories.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group glass-2 flex min-h-32 flex-col justify-between rounded-xl p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-float"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-violet-100 text-accent-text transition-colors duration-200 group-hover:bg-accent group-hover:text-on-accent">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="mt-5 space-y-0.5">
                <p className="type-h4 text-strong">{t(`categories.${key}`)}</p>
                <p className="type-caption text-muted font-normal">{t(`categories.${key}Desc`)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Nové nabídky (AC-1.3) */}
      <section aria-labelledby="sec-newest" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">{t("newestEyebrow")}</p>
            <h2 id="sec-newest" className="type-h2 text-strong">
              {t("newestTitle")}
            </h2>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} asChild>
            <Link href="/prodej/vse">{t("viewAll")}</Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((listing, idx) => (
            <ListingCard key={listing.id} listing={listing} priority={idx < 2} />
          ))}
        </div>
      </section>

      {/* 4. Doporučené nabídky (AC-1.3) */}
      <section aria-labelledby="sec-featured" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="type-eyebrow text-muted">{t("featuredEyebrow")}</p>
            <h2 id="sec-featured" className="type-h2 text-strong">
              {t("featuredTitle")}
            </h2>
          </div>
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} asChild>
            <Link href="/pronajem/vse">{t("viewAll")}</Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* 5. Oblíbené lokality — 8 měst s počty z DB (AC-1.4) */}
      <section aria-labelledby="sec-cities" className="space-y-6">
        <div className="space-y-1">
          <p className="type-eyebrow text-muted">{t("citiesEyebrow")}</p>
          <h2 id="sec-cities" className="type-h2 text-strong">
            {t("citiesTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {popularCities.map((city, idx) => (
            <Link
              key={city.id}
              href={`/prodej/vse/${city.fullSlug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line-subtle bg-surface shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-float"
            >
              <Image
                src={CITY_BACKDROPS[idx % CITY_BACKDROPS.length]!}
                alt={city.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 300px"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <div className="scrim-photo absolute inset-0" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-gray-0">
                <p className="type-h4 text-gray-0">{city.name}</p>
                <p className="type-caption text-gray-100 tnum">
                  {formatListingCount(city.listingCount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Pruh důvěry se 3 čísly ve Fraunces */}
      <section aria-labelledby="sec-trust">
        <h2 id="sec-trust" className="sr-only">
          {t("trustEyebrow")}
        </h2>
        <div className="grid gap-4 rounded-2xl border border-line-subtle bg-surface p-6 shadow-card sm:grid-cols-3 sm:p-8">
          <div className="space-y-1">
            <p className="type-h1 text-strong tnum">{formatNumber(stats.activeListings)}</p>
            <p className="type-small text-muted">{t("trustListings")}</p>
          </div>
          <div className="space-y-1">
            <p className="type-h1 text-strong tnum">{formatNumber(stats.agentsCount)}</p>
            <p className="type-small text-muted">{t("trustAgents")}</p>
          </div>
          <div className="space-y-1">
            <p className="type-h1 text-strong tnum">{formatNumber(stats.citiesCount)}</p>
            <p className="type-small text-muted">{t("trustCities")}</p>
          </div>
        </div>
      </section>

      {/* 7. CTA pro makléře */}
      <section aria-labelledby="sec-cta">
        <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-100 to-surface p-8 shadow-2 sm:p-12">
          <div className="max-w-2xl space-y-4">
            <p className="type-eyebrow text-accent-text">{t("ctaEyebrow")}</p>
            <h2 id="sec-cta" className="type-h2 text-strong">
              {nbsp(t("ctaTitle"))}
            </h2>
            <p className="type-body-lg text-body">{nbsp(t("ctaBody"))}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button variant="primary" size="lg" asChild>
                <Link href="/inzerce">{t("ctaPrimary")}</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/o-nas">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
