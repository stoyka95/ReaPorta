import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agencies,
  agentProfiles,
  inquiries,
  listingDailyStats,
  listingImages,
  listingPriceHistory,
  listings,
  users,
} from "@/db/schema";
import type { ListingCardItem } from "@/db/queries/listings";

export type InquiryStatus = "new" | "read" | "replied" | "archived";

export interface AgentInquiryRow {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export async function getAgentInquiries(agentId: string): Promise<AgentInquiryRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: inquiries.id,
      listingId: inquiries.listingId,
      listingSlug: listings.slug,
      listingTitle: listings.title,
      name: inquiries.name,
      email: inquiries.email,
      phone: inquiries.phone,
      message: inquiries.message,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
    })
    .from(inquiries)
    .innerJoin(listings, eq(inquiries.listingId, listings.id))
    .where(eq(inquiries.agentId, agentId))
    .orderBy(desc(inquiries.createdAt))
    .limit(200);

  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function updateAgentInquiryStatus(
  agentId: string,
  inquiryId: string,
  status: InquiryStatus,
  isAdmin = false,
): Promise<boolean> {
  const db = getDb();
  const condition = isAdmin
    ? eq(inquiries.id, inquiryId)
    : and(eq(inquiries.id, inquiryId), eq(inquiries.agentId, agentId));

  const updated = await db
    .update(inquiries)
    .set({ status })
    .where(condition)
    .returning({ id: inquiries.id });

  return updated.length > 0;
}

export interface AgentStatsData {
  totals: {
    views30d: number;
    phoneReveals30d: number;
    favoritesTotal: number;
    inquiriesTotal: number;
  };
  dailyViews: Array<{ day: string; views: number }>;
  perListing: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    views30d: number;
    phoneReveals30d: number;
    favoritesCount: number;
    inquiriesCount: number;
  }>;
}

export async function getAgentStats(agentId: string): Promise<AgentStatsData> {
  const db = getDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const sinceDayStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [agentListings, dailyRows, perListingStats, perListingInquiries] = await Promise.all([
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        status: listings.status,
        favoritesCount: listings.favoritesCount,
      })
      .from(listings)
      .where(eq(listings.agentId, agentId))
      .orderBy(desc(listings.viewsCount)),
    db
      .select({
        day: listingDailyStats.day,
        views: sql<number>`COALESCE(SUM(${listingDailyStats.views}), 0)::int`,
        phoneReveals: sql<number>`COALESCE(SUM(${listingDailyStats.phoneReveals}), 0)::int`,
      })
      .from(listingDailyStats)
      .innerJoin(listings, eq(listingDailyStats.listingId, listings.id))
      .where(and(eq(listings.agentId, agentId), gte(listingDailyStats.day, sinceDayStr)))
      .groupBy(listingDailyStats.day)
      .orderBy(asc(listingDailyStats.day)),
    db
      .select({
        listingId: listingDailyStats.listingId,
        views: sql<number>`COALESCE(SUM(${listingDailyStats.views}), 0)::int`,
        phoneReveals: sql<number>`COALESCE(SUM(${listingDailyStats.phoneReveals}), 0)::int`,
      })
      .from(listingDailyStats)
      .innerJoin(listings, eq(listingDailyStats.listingId, listings.id))
      .where(and(eq(listings.agentId, agentId), gte(listingDailyStats.day, sinceDayStr)))
      .groupBy(listingDailyStats.listingId),
    db
      .select({
        listingId: inquiries.listingId,
        count: sql<number>`count(*)::int`,
      })
      .from(inquiries)
      .where(eq(inquiries.agentId, agentId))
      .groupBy(inquiries.listingId),
  ]);

  const dayMap = new Map(dailyRows.map((d) => [d.day, d]));
  const dailyViews: Array<{ day: string; views: number }> = [];
  let views30d = 0;
  let phoneReveals30d = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(thirtyDaysAgo.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const rec = dayMap.get(key);
    const v = rec?.views ?? 0;
    const p = rec?.phoneReveals ?? 0;
    views30d += v;
    phoneReveals30d += p;
    dailyViews.push({ day: key, views: v });
  }

  const statsMap = new Map(perListingStats.map((s) => [s.listingId, s]));
  const inqMap = new Map(perListingInquiries.map((i) => [i.listingId, i.count]));

  let favoritesTotal = 0;
  let inquiriesTotal = 0;

  const perListing = agentListings
    .map((l) => {
      const s = statsMap.get(l.id);
      const inq = inqMap.get(l.id) ?? 0;
      favoritesTotal += l.favoritesCount;
      inquiriesTotal += inq;
      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        status: l.status,
        views30d: s?.views ?? 0,
        phoneReveals30d: s?.phoneReveals ?? 0,
        favoritesCount: l.favoritesCount,
        inquiriesCount: inq,
      };
    })
    .sort((a, b) => b.views30d - a.views30d);

  return {
    totals: {
      views30d,
      phoneReveals30d,
      favoritesTotal,
      inquiriesTotal,
    },
    dailyViews,
    perListing,
  };
}

export interface AgentProfileEditData {
  userId: string;
  displayName: string;
  slug: string;
  bio: string;
  phonePublic: string;
  emailPublic: string;
  languages: string[];
  verifiedAt: string | null;
  agency: { id: string; name: string; slug: string } | null;
}

export async function getAgentProfileForEdit(userId: string): Promise<AgentProfileEditData | null> {
  const db = getDb();
  const [row] = await db
    .select({
      userId: agentProfiles.userId,
      displayName: agentProfiles.displayName,
      slug: agentProfiles.slug,
      bio: agentProfiles.bio,
      phonePublic: agentProfiles.phonePublic,
      emailPublic: agentProfiles.emailPublic,
      languages: agentProfiles.languages,
      verifiedAt: agentProfiles.verifiedAt,
      agencyId: agencies.id,
      agencyName: agencies.name,
      agencySlug: agencies.slug,
    })
    .from(agentProfiles)
    .leftJoin(agencies, eq(agentProfiles.agencyId, agencies.id))
    .where(eq(agentProfiles.userId, userId))
    .limit(1);

  if (!row) return null;

  return {
    userId: row.userId,
    displayName: row.displayName,
    slug: row.slug,
    bio: row.bio ?? "",
    phonePublic: row.phonePublic ?? "",
    emailPublic: row.emailPublic ?? "",
    languages: row.languages,
    verifiedAt: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    agency:
      row.agencyId && row.agencyName && row.agencySlug
        ? { id: row.agencyId, name: row.agencyName, slug: row.agencySlug }
        : null,
  };
}

export async function updateAgentProfile(
  userId: string,
  input: {
    displayName: string;
    bio?: string | null;
    phonePublic?: string | null;
    emailPublic?: string | null;
    languages: string[];
  },
): Promise<void> {
  const db = getDb();
  await db
    .update(agentProfiles)
    .set({
      displayName: input.displayName.trim(),
      bio: input.bio?.trim() || null,
      phonePublic: input.phonePublic?.trim() || null,
      emailPublic: input.emailPublic?.trim() || null,
      languages: input.languages.length > 0 ? input.languages : ["cs"],
    })
    .where(eq(agentProfiles.userId, userId));
}

async function hydrateListingCards(
  rows: Array<{
    id: string;
    slug: string;
    offerType: "sale" | "rent";
    category: "flat" | "house" | "land" | "commercial" | "other";
    title: string;
    price: string | null;
    priceUnit: "total" | "per_month" | "per_m2_month";
    priceNegotiable: boolean;
    priceOnRequest: boolean;
    pricePerM2: string | null;
    usableArea: string | null;
    landArea: string | null;
    city: string;
    district: string | null;
    lat: number;
    lng: number;
    showExactLocation: boolean;
    disposition: ListingCardItem["disposition"];
    energyClass: ListingCardItem["energyClass"];
    amenities: string[];
    publishedAt: Date | null;
  }>,
): Promise<ListingCardItem[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);

  const [imgRows, histRows] = await Promise.all([
    db
      .select({
        id: listingImages.id,
        listingId: listingImages.listingId,
        storageKey: listingImages.storageKey,
        blurDataUrl: listingImages.blurDataUrl,
        alt: listingImages.alt,
        sortOrder: listingImages.sortOrder,
        isCover: listingImages.isCover,
      })
      .from(listingImages)
      .where(inArray(listingImages.listingId, ids))
      .orderBy(desc(listingImages.isCover), asc(listingImages.sortOrder)),
    db
      .select({
        listingId: listingPriceHistory.listingId,
        price: listingPriceHistory.price,
      })
      .from(listingPriceHistory)
      .where(inArray(listingPriceHistory.listingId, ids)),
  ]);

  const imagesByListing = new Map<string, ListingCardItem["images"]>();
  for (const img of imgRows) {
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

  const maxHistByListing = new Map<string, number>();
  for (const h of histRows) {
    const p = Number(h.price);
    const prev = maxHistByListing.get(h.listingId) ?? 0;
    if (p > prev) maxHistByListing.set(h.listingId, p);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return rows.map((r) => {
    const currentPrice = r.price !== null ? Number(r.price) : null;
    const maxPrev = maxHistByListing.get(r.id) ?? 0;
    return {
      id: r.id,
      slug: r.slug,
      offerType: r.offerType,
      category: r.category,
      title: r.title,
      price: currentPrice,
      priceUnit: r.priceUnit,
      priceNegotiable: r.priceNegotiable,
      priceOnRequest: r.priceOnRequest,
      pricePerM2: r.pricePerM2 !== null ? Number(r.pricePerM2) : null,
      usableArea: r.usableArea !== null ? Number(r.usableArea) : null,
      landArea: r.landArea !== null ? Number(r.landArea) : null,
      city: r.city,
      district: r.district,
      lat: r.lat,
      lng: r.lng,
      showExactLocation: r.showExactLocation,
      disposition: r.disposition,
      energyClass: r.energyClass,
      amenities: r.amenities,
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      isNew: r.publishedAt !== null && r.publishedAt.getTime() >= sevenDaysAgo,
      isReduced: currentPrice !== null && maxPrev > currentPrice,
      images: imagesByListing.get(r.id) ?? [],
    };
  });
}

export interface PublicAgentSummary {
  userId: string;
  displayName: string;
  slug: string;
  bio: string | null;
  photoKey: string | null;
  languages: string[];
  verifiedAt: string | null;
  agency: { name: string; slug: string } | null;
  activeListingsCount: number;
}

export async function getPublicAgentsDirectory(): Promise<PublicAgentSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      userId: agentProfiles.userId,
      displayName: agentProfiles.displayName,
      slug: agentProfiles.slug,
      bio: agentProfiles.bio,
      photoKey: agentProfiles.photoKey,
      languages: agentProfiles.languages,
      verifiedAt: agentProfiles.verifiedAt,
      agencyName: agencies.name,
      agencySlug: agencies.slug,
      activeListingsCount: sql<number>`(
        SELECT count(*)::int FROM ${listings}
        WHERE ${listings.agentId} = ${agentProfiles.userId}
          AND ${listings.status} = 'active'
      )`,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .leftJoin(agencies, eq(agentProfiles.agencyId, agencies.id))
    .where(and(isNull(users.deletedAt), isNull(users.blockedAt)))
    .orderBy(desc(agentProfiles.verifiedAt), asc(agentProfiles.displayName));

  return rows.map((r) => ({
    userId: r.userId,
    displayName: r.displayName,
    slug: r.slug,
    bio: r.bio,
    photoKey: r.photoKey,
    languages: r.languages,
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
    agency: r.agencyName && r.agencySlug ? { name: r.agencyName, slug: r.agencySlug } : null,
    activeListingsCount: r.activeListingsCount,
  }));
}

export interface PublicAgentDetail {
  userId: string;
  displayName: string;
  slug: string;
  bio: string | null;
  photoKey: string | null;
  phonePublic: string | null;
  emailPublic: string | null;
  languages: string[];
  verifiedAt: string | null;
  agency: {
    id: string;
    name: string;
    slug: string;
    logoKey: string | null;
    address: string | null;
  } | null;
  listings: ListingCardItem[];
}

export async function getPublicAgentBySlug(slug: string): Promise<PublicAgentDetail | null> {
  const db = getDb();
  const [agent] = await db
    .select({
      userId: agentProfiles.userId,
      displayName: agentProfiles.displayName,
      slug: agentProfiles.slug,
      bio: agentProfiles.bio,
      photoKey: agentProfiles.photoKey,
      phonePublic: agentProfiles.phonePublic,
      emailPublic: agentProfiles.emailPublic,
      languages: agentProfiles.languages,
      verifiedAt: agentProfiles.verifiedAt,
      agencyId: agencies.id,
      agencyName: agencies.name,
      agencySlug: agencies.slug,
      agencyLogoKey: agencies.logoKey,
      agencyAddress: agencies.address,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .leftJoin(agencies, eq(agentProfiles.agencyId, agencies.id))
    .where(and(eq(agentProfiles.slug, slug), isNull(users.deletedAt), isNull(users.blockedAt)))
    .limit(1);

  if (!agent) return null;

  // Zobrazit VÝHRADNĚ aktivní nabídky (AC-7.2 / QA C11)
  const activeRows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      offerType: listings.offerType,
      category: listings.category,
      title: listings.title,
      price: listings.price,
      priceUnit: listings.priceUnit,
      priceNegotiable: listings.priceNegotiable,
      priceOnRequest: listings.priceOnRequest,
      pricePerM2: listings.pricePerM2,
      usableArea: listings.usableArea,
      landArea: listings.landArea,
      city: listings.city,
      district: listings.district,
      lat: listings.lat,
      lng: listings.lng,
      showExactLocation: listings.showExactLocation,
      disposition: listings.disposition,
      energyClass: listings.energyClass,
      amenities: listings.amenities,
      publishedAt: listings.publishedAt,
    })
    .from(listings)
    .where(and(eq(listings.agentId, agent.userId), eq(listings.status, "active")))
    .orderBy(desc(listings.publishedAt))
    .limit(48);

  const hydrated = await hydrateListingCards(activeRows);

  return {
    userId: agent.userId,
    displayName: agent.displayName,
    slug: agent.slug,
    bio: agent.bio,
    photoKey: agent.photoKey,
    phonePublic: agent.phonePublic,
    emailPublic: agent.emailPublic,
    languages: agent.languages,
    verifiedAt: agent.verifiedAt ? agent.verifiedAt.toISOString() : null,
    agency:
      agent.agencyId && agent.agencyName && agent.agencySlug
        ? {
            id: agent.agencyId,
            name: agent.agencyName,
            slug: agent.agencySlug,
            logoKey: agent.agencyLogoKey,
            address: agent.agencyAddress,
          }
        : null,
    listings: hydrated,
  };
}

export interface PublicAgencyDetail {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  agents: Array<{
    userId: string;
    displayName: string;
    slug: string;
    languages: string[];
    verifiedAt: string | null;
  }>;
  listings: ListingCardItem[];
}

export async function getPublicAgencyBySlug(slug: string): Promise<PublicAgencyDetail | null> {
  const db = getDb();
  const [agency] = await db.select().from(agencies).where(eq(agencies.slug, slug)).limit(1);

  if (!agency) return null;

  const [agencyAgents, activeRows] = await Promise.all([
    db
      .select({
        userId: agentProfiles.userId,
        displayName: agentProfiles.displayName,
        slug: agentProfiles.slug,
        languages: agentProfiles.languages,
        verifiedAt: agentProfiles.verifiedAt,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(
        and(
          eq(agentProfiles.agencyId, agency.id),
          isNull(users.deletedAt),
          isNull(users.blockedAt),
        ),
      )
      .orderBy(asc(agentProfiles.displayName)),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        offerType: listings.offerType,
        category: listings.category,
        title: listings.title,
        price: listings.price,
        priceUnit: listings.priceUnit,
        priceNegotiable: listings.priceNegotiable,
        priceOnRequest: listings.priceOnRequest,
        pricePerM2: listings.pricePerM2,
        usableArea: listings.usableArea,
        landArea: listings.landArea,
        city: listings.city,
        district: listings.district,
        lat: listings.lat,
        lng: listings.lng,
        showExactLocation: listings.showExactLocation,
        disposition: listings.disposition,
        energyClass: listings.energyClass,
        amenities: listings.amenities,
        publishedAt: listings.publishedAt,
      })
      .from(listings)
      .where(and(eq(listings.agencyId, agency.id), eq(listings.status, "active")))
      .orderBy(desc(listings.publishedAt))
      .limit(48),
  ]);

  const hydrated = await hydrateListingCards(activeRows);

  return {
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    logoKey: agency.logoKey,
    description: agency.description,
    website: agency.website,
    email: agency.email,
    phone: agency.phone,
    address: agency.address,
    agents: agencyAgents.map((a) => ({
      ...a,
      verifiedAt: a.verifiedAt ? a.verifiedAt.toISOString() : null,
    })),
    listings: hydrated,
  };
}
