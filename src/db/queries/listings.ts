import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agencies,
  agentProfiles,
  listingImages,
  listingPriceHistory,
  listings,
  locations,
} from "@/db/schema";
import { buildListingOrderBy, buildListingWhere } from "@/lib/search/build-query";
import { searchFiltersSchema, type SearchFiltersInput } from "@/lib/search/schema";

export interface ListingCardItem {
  id: string;
  slug: string;
  title: string;
  offerType: "sale" | "rent";
  category: "flat" | "house" | "land" | "commercial" | "other";
  disposition: string | null;
  price: number | null;
  priceUnit: "total" | "per_month" | "per_m2_month";
  pricePerM2: number | null;
  priceNegotiable: boolean;
  priceOnRequest: boolean;
  usableArea: number | null;
  landArea: number | null;
  city: string;
  district: string | null;
  lat: number;
  lng: number;
  showExactLocation: boolean;
  amenities: string[];
  energyClass: string | null;
  publishedAt: string | null;
  isReduced: boolean;
  isNew: boolean;
  images: Array<{
    id: string;
    storageKey: string;
    blurDataUrl: string;
    alt: string;
    isCover: boolean;
  }>;
}

export interface SearchListingsResult {
  items: ListingCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function searchListings(
  rawFilters: SearchFiltersInput,
): Promise<SearchListingsResult> {
  const filters = searchFiltersSchema.parse(rawFilters);
  const db = getDb();
  const whereClause = buildListingWhere(filters);
  const orderBy = buildListingOrderBy(filters.sort);
  const offset = (filters.page - 1) * filters.pageSize;

  const [countRows, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(whereClause),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        offerType: listings.offerType,
        category: listings.category,
        disposition: listings.disposition,
        price: listings.price,
        priceUnit: listings.priceUnit,
        pricePerM2: listings.pricePerM2,
        priceNegotiable: listings.priceNegotiable,
        priceOnRequest: listings.priceOnRequest,
        usableArea: listings.usableArea,
        landArea: listings.landArea,
        city: listings.city,
        district: listings.district,
        lat: listings.lat,
        lng: listings.lng,
        showExactLocation: listings.showExactLocation,
        amenities: listings.amenities,
        energyClass: listings.energyClass,
        publishedAt: listings.publishedAt,
      })
      .from(listings)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(filters.pageSize)
      .offset(offset),
  ]);

  const total = countRows[0]?.count ?? 0;
  const items = await hydrateListingCards(rows);

  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

async function hydrateListingCards(
  rows: Array<{
    id: string;
    slug: string;
    title: string;
    offerType: "sale" | "rent";
    category: "flat" | "house" | "land" | "commercial" | "other";
    disposition: string | null;
    price: string | null;
    priceUnit: "total" | "per_month" | "per_m2_month";
    pricePerM2: string | null;
    priceNegotiable: boolean;
    priceOnRequest: boolean;
    usableArea: string | null;
    landArea: string | null;
    city: string;
    district: string | null;
    lat: number;
    lng: number;
    showExactLocation: boolean;
    amenities: string[];
    energyClass: string | null;
    publishedAt: Date | null;
  }>,
): Promise<ListingCardItem[]> {
  if (rows.length === 0) return [];

  const db = getDb();
  const ids = rows.map((r) => r.id);

  const [imagesRows, historyRows] = await Promise.all([
    db
      .select({
        id: listingImages.id,
        listingId: listingImages.listingId,
        storageKey: listingImages.storageKey,
        blurDataUrl: listingImages.blurDataUrl,
        alt: listingImages.alt,
        isCover: listingImages.isCover,
        sortOrder: listingImages.sortOrder,
      })
      .from(listingImages)
      .where(inArray(listingImages.listingId, ids))
      .orderBy(asc(listingImages.sortOrder)),
    db
      .select({
        listingId: listingPriceHistory.listingId,
        price: listingPriceHistory.price,
        changedAt: listingPriceHistory.changedAt,
      })
      .from(listingPriceHistory)
      .where(inArray(listingPriceHistory.listingId, ids))
      .orderBy(desc(listingPriceHistory.changedAt)),
  ]);

  const imagesByListing = new Map<string, ListingCardItem["images"]>();
  for (const img of imagesRows) {
    const arr = imagesByListing.get(img.listingId) ?? [];
    if (arr.length < 5) {
      arr.push({
        id: img.id,
        storageKey: img.storageKey,
        blurDataUrl: img.blurDataUrl,
        alt: img.alt,
        isCover: img.isCover,
      });
      imagesByListing.set(img.listingId, arr);
    }
  }

  const reducedSet = new Set<string>();
  const latestTwo = new Map<string, number[]>();
  for (const h of historyRows) {
    const arr = latestTwo.get(h.listingId) ?? [];
    if (arr.length < 2) {
      arr.push(Number(h.price));
      latestTwo.set(h.listingId, arr);
    }
  }
  for (const [lid, prices] of latestTwo.entries()) {
    if (prices.length >= 2 && prices[0]! < prices[1]!) {
      reducedSet.add(lid);
    }
  }

  const sevenDaysAgo = Date.now() - 7 * 86_400_000;

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    offerType: r.offerType,
    category: r.category,
    disposition: r.disposition,
    price: r.price !== null ? Number(r.price) : null,
    priceUnit: r.priceUnit,
    pricePerM2: r.pricePerM2 !== null ? Number(r.pricePerM2) : null,
    priceNegotiable: r.priceNegotiable,
    priceOnRequest: r.priceOnRequest,
    usableArea: r.usableArea !== null ? Number(r.usableArea) : null,
    landArea: r.landArea !== null ? Number(r.landArea) : null,
    city: r.city,
    district: r.district,
    lat: r.lat,
    lng: r.lng,
    showExactLocation: r.showExactLocation,
    amenities: r.amenities,
    energyClass: r.energyClass,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    isReduced: reducedSet.has(r.id),
    isNew: r.publishedAt ? r.publishedAt.getTime() >= sevenDaysAgo : false,
    images: imagesByListing.get(r.id) ?? [],
  }));
}

export interface MapPoint {
  id: string;
  slug: string;
  lat: number;
  lng: number;
  showExactLocation: boolean;
  price: number | null;
  priceUnit: "total" | "per_month" | "per_m2_month";
  priceOnRequest: boolean;
  category: "flat" | "house" | "land" | "commercial" | "other";
  offerType: "sale" | "rent";
  title: string;
  city: string;
  district: string | null;
  usableArea: number | null;
  disposition: string | null;
  coverKey: string | null;
}

function roundApproximateCoord(value: number): number {
  // ~300m zaokrouhlení pro inzeráty s show_exact_location = false
  return Math.round(value * 333) / 333;
}

export async function searchMapPoints(rawFilters: SearchFiltersInput): Promise<MapPoint[]> {
  const filters = searchFiltersSchema.parse(rawFilters);
  const db = getDb();
  const whereClause = buildListingWhere(filters);

  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      lat: listings.lat,
      lng: listings.lng,
      showExactLocation: listings.showExactLocation,
      price: listings.price,
      priceUnit: listings.priceUnit,
      priceOnRequest: listings.priceOnRequest,
      category: listings.category,
      offerType: listings.offerType,
      title: listings.title,
      city: listings.city,
      district: listings.district,
      usableArea: listings.usableArea,
      disposition: listings.disposition,
    })
    .from(listings)
    .where(whereClause)
    .orderBy(desc(listings.publishedAt))
    .limit(2000);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const covers = await db
    .select({
      listingId: listingImages.listingId,
      storageKey: listingImages.storageKey,
    })
    .from(listingImages)
    .where(and(inArray(listingImages.listingId, ids), eq(listingImages.isCover, true)));

  const coverMap = new Map(covers.map((c) => [c.listingId, c.storageKey]));

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    lat: r.showExactLocation ? r.lat : roundApproximateCoord(r.lat),
    lng: r.showExactLocation ? r.lng : roundApproximateCoord(r.lng),
    showExactLocation: r.showExactLocation,
    price: r.price !== null ? Number(r.price) : null,
    priceUnit: r.priceUnit,
    priceOnRequest: r.priceOnRequest,
    category: r.category,
    offerType: r.offerType,
    title: r.title,
    city: r.city,
    district: r.district,
    usableArea: r.usableArea !== null ? Number(r.usableArea) : null,
    disposition: r.disposition,
    coverKey: coverMap.get(r.id) ?? null,
  }));
}

export async function getListingBySlug(slug: string) {
  const db = getDb();
  const rows = await db
    .select({
      listing: listings,
      location: locations,
      agent: agentProfiles,
      agency: agencies,
    })
    .from(listings)
    .innerJoin(locations, eq(listings.locationId, locations.id))
    .leftJoin(agentProfiles, eq(listings.agentId, agentProfiles.userId))
    .leftJoin(agencies, eq(listings.agencyId, agencies.id))
    .where(eq(listings.slug, slug))
    .limit(1);

  const found = rows[0];
  if (!found) return null;

  const [images, priceHistory] = await Promise.all([
    db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, found.listing.id))
      .orderBy(asc(listingImages.sortOrder)),
    db
      .select()
      .from(listingPriceHistory)
      .where(eq(listingPriceHistory.listingId, found.listing.id))
      .orderBy(desc(listingPriceHistory.changedAt)),
  ]);

  const l = found.listing;
  const lat = l.showExactLocation ? l.lat : roundApproximateCoord(l.lat);
  const lng = l.showExactLocation ? l.lng : roundApproximateCoord(l.lng);

  return {
    ...l,
    lat,
    lng,
    price: l.price !== null ? Number(l.price) : null,
    pricePerM2: l.pricePerM2 !== null ? Number(l.pricePerM2) : null,
    feesMonthly: l.feesMonthly !== null ? Number(l.feesMonthly) : null,
    deposit: l.deposit !== null ? Number(l.deposit) : null,
    usableArea: l.usableArea !== null ? Number(l.usableArea) : null,
    landArea: l.landArea !== null ? Number(l.landArea) : null,
    builtArea: l.builtArea !== null ? Number(l.builtArea) : null,
    location: found.location,
    agent: found.agent
      ? {
          userId: found.agent.userId,
          displayName: found.agent.displayName,
          slug: found.agent.slug,
          bio: found.agent.bio,
          photoKey: found.agent.photoKey,
          languages: found.agent.languages,
          verifiedAt: found.agent.verifiedAt,
          hasPhone: Boolean(found.agent.phonePublic),
        }
      : null,
    agency: found.agency,
    images,
    priceHistory: priceHistory.map((p) => ({
      id: p.id,
      price: Number(p.price),
      changedAt: p.changedAt.toISOString(),
    })),
  };
}

export async function getFeaturedAndNewListings() {
  const db = getDb();

  const [newestRows, featuredRows] = await Promise.all([
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        offerType: listings.offerType,
        category: listings.category,
        disposition: listings.disposition,
        price: listings.price,
        priceUnit: listings.priceUnit,
        pricePerM2: listings.pricePerM2,
        priceNegotiable: listings.priceNegotiable,
        priceOnRequest: listings.priceOnRequest,
        usableArea: listings.usableArea,
        landArea: listings.landArea,
        city: listings.city,
        district: listings.district,
        lat: listings.lat,
        lng: listings.lng,
        showExactLocation: listings.showExactLocation,
        amenities: listings.amenities,
        energyClass: listings.energyClass,
        publishedAt: listings.publishedAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.publishedAt))
      .limit(4),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        offerType: listings.offerType,
        category: listings.category,
        disposition: listings.disposition,
        price: listings.price,
        priceUnit: listings.priceUnit,
        pricePerM2: listings.pricePerM2,
        priceNegotiable: listings.priceNegotiable,
        priceOnRequest: listings.priceOnRequest,
        usableArea: listings.usableArea,
        landArea: listings.landArea,
        city: listings.city,
        district: listings.district,
        lat: listings.lat,
        lng: listings.lng,
        showExactLocation: listings.showExactLocation,
        amenities: listings.amenities,
        energyClass: listings.energyClass,
        publishedAt: listings.publishedAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.favoritesCount), desc(listings.viewsCount))
      .limit(4),
  ]);

  const [newest, featured] = await Promise.all([
    hydrateListingCards(newestRows),
    hydrateListingCards(featuredRows),
  ]);

  return { newest, featured };
}

export async function getSimilarListings(params: {
  excludeId: string;
  offerType: "sale" | "rent";
  category: "flat" | "house" | "land" | "commercial" | "other";
  city: string;
  price: number | null;
  limit?: number;
}): Promise<ListingCardItem[]> {
  const db = getDb();
  const limit = params.limit ?? 4;

  const baseConditions = [
    eq(listings.status, "active"),
    ne(listings.id, params.excludeId),
    eq(listings.offerType, params.offerType),
    eq(listings.category, params.category),
  ];

  const strictConditions = [...baseConditions, eq(listings.city, params.city)];
  if (params.price !== null && params.price > 0) {
    strictConditions.push(
      gte(listings.price, String(Math.round(params.price * 0.75))),
      lte(listings.price, String(Math.round(params.price * 1.25))),
    );
  }

  let rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      offerType: listings.offerType,
      category: listings.category,
      disposition: listings.disposition,
      price: listings.price,
      priceUnit: listings.priceUnit,
      pricePerM2: listings.pricePerM2,
      priceNegotiable: listings.priceNegotiable,
      priceOnRequest: listings.priceOnRequest,
      usableArea: listings.usableArea,
      landArea: listings.landArea,
      city: listings.city,
      district: listings.district,
      lat: listings.lat,
      lng: listings.lng,
      showExactLocation: listings.showExactLocation,
      amenities: listings.amenities,
      energyClass: listings.energyClass,
      publishedAt: listings.publishedAt,
    })
    .from(listings)
    .where(and(...strictConditions))
    .orderBy(desc(listings.publishedAt))
    .limit(limit);

  if (rows.length < limit) {
    const existingIds = new Set(rows.map((r) => r.id));
    const fallbackRows = await db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        offerType: listings.offerType,
        category: listings.category,
        disposition: listings.disposition,
        price: listings.price,
        priceUnit: listings.priceUnit,
        pricePerM2: listings.pricePerM2,
        priceNegotiable: listings.priceNegotiable,
        priceOnRequest: listings.priceOnRequest,
        usableArea: listings.usableArea,
        landArea: listings.landArea,
        city: listings.city,
        district: listings.district,
        lat: listings.lat,
        lng: listings.lng,
        showExactLocation: listings.showExactLocation,
        amenities: listings.amenities,
        energyClass: listings.energyClass,
        publishedAt: listings.publishedAt,
      })
      .from(listings)
      .where(and(...baseConditions))
      .orderBy(desc(listings.publishedAt))
      .limit(limit + existingIds.size);

    for (const r of fallbackRows) {
      if (!existingIds.has(r.id) && rows.length < limit) {
        rows = [...rows, r];
        existingIds.add(r.id);
      }
    }
  }

  return hydrateListingCards(rows);
}

export async function getPortalStats() {
  const db = getDb();
  const [activeListings, activeAgents, activeCities] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "active")),
    db.select({ count: sql<number>`count(*)::int` }).from(agentProfiles),
    db
      .select({ count: sql<number>`count(distinct ${listings.city})::int` })
      .from(listings)
      .where(eq(listings.status, "active")),
  ]);

  return {
    activeListings: activeListings[0]?.count ?? 0,
    agentsCount: activeAgents[0]?.count ?? 0,
    citiesCount: activeCities[0]?.count ?? 0,
  };
}

export interface PriceHistogramResult {
  min: number;
  max: number;
  buckets: number[];
}

export async function getPriceHistogram(
  rawFilters: SearchFiltersInput,
  bucketCount = 16,
): Promise<PriceHistogramResult> {
  const filters = searchFiltersSchema.parse({
    ...rawFilters,
    priceMin: undefined,
    priceMax: undefined,
  });
  const db = getDb();
  const whereClause = buildListingWhere(filters);

  const rows = await db
    .select({ price: listings.price })
    .from(listings)
    .where(and(whereClause, sql`${listings.price} IS NOT NULL`));

  const prices = rows.map((r) => Number(r.price)).filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) {
    const defaultMax = filters.offerType === "rent" ? 60_000 : 20_000_000;
    return { min: 0, max: defaultMax, buckets: Array<number>(bucketCount).fill(0) };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) {
    const buckets = Array<number>(bucketCount).fill(0);
    buckets[0] = prices.length;
    return { min, max: max + 1, buckets };
  }

  const buckets = Array<number>(bucketCount).fill(0);
  const step = (max - min) / bucketCount;
  for (const p of prices) {
    const idx = Math.min(bucketCount - 1, Math.floor((p - min) / step));
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  }

  return { min, max, buckets };
}
