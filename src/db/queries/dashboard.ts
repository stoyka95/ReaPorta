import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agentProfiles,
  inquiries,
  listingDailyStats,
  listingImages,
  listingPriceHistory,
  listings,
  locations,
} from "@/db/schema";
import { generateListingSlug } from "@/lib/slug";
import { deleteStoredListingImage } from "@/lib/image-upload";
import type { DraftPatchInput } from "@/features/dashboard/schema";

export interface AgentDashboardOverview {
  counts: {
    active: number;
    pending: number;
    draft: number;
    paused: number;
    sold: number;
    expired: number;
    rejected: number;
    total: number;
  };
  views30d: number;
  phoneReveals30d: number;
  newInquiriesCount: number;
  dailyViews: Array<{ day: string; views: number }>;
  attentionListings: Array<{
    id: string;
    slug: string;
    title: string;
    status: string;
    rejectReason: string | null;
    updatedAt: string;
  }>;
}

export async function getAgentDashboardOverview(agentId: string): Promise<AgentDashboardOverview> {
  const db = getDb();

  const statusRows = await db
    .select({
      status: listings.status,
      count: sql<number>`count(*)::int`,
    })
    .from(listings)
    .where(eq(listings.agentId, agentId))
    .groupBy(listings.status);

  const counts = {
    active: 0,
    pending: 0,
    draft: 0,
    paused: 0,
    sold: 0,
    expired: 0,
    rejected: 0,
    total: 0,
  };
  for (const row of statusRows) {
    counts[row.status] = row.count;
    counts.total += row.count;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const sinceDayStr = thirtyDaysAgo.toISOString().slice(0, 10);

  const [dailyRows, inquiryRow, attentionRows] = await Promise.all([
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
      .select({ count: sql<number>`count(*)::int` })
      .from(inquiries)
      .where(and(eq(inquiries.agentId, agentId), eq(inquiries.status, "new"))),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        status: listings.status,
        rejectReason: listings.rejectReason,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(
        and(
          eq(listings.agentId, agentId),
          inArray(listings.status, ["draft", "rejected", "pending"]),
        ),
      )
      .orderBy(desc(listings.updatedAt))
      .limit(5),
  ]);

  // Doplnit kompletní řadu 30 dní (včetně nulových dnů)
  const dayMap = new Map(dailyRows.map((r) => [r.day, r]));
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

  return {
    counts,
    views30d,
    phoneReveals30d,
    newInquiriesCount: inquiryRow[0]?.count ?? 0,
    dailyViews,
    attentionListings: attentionRows.map((r) => ({
      ...r,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export interface AgentListingRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "pending" | "active" | "paused" | "sold" | "rejected" | "expired";
  rejectReason: string | null;
  offerType: "sale" | "rent";
  category: "flat" | "house" | "land" | "commercial" | "other";
  city: string;
  district: string | null;
  price: number | null;
  priceUnit: "total" | "per_month" | "per_m2_month";
  priceOnRequest: boolean;
  usableArea: number | null;
  viewsCount: number;
  favoritesCount: number;
  coverKey: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

export async function getAgentListings(
  agentId: string,
  filters?: {
    status?: string;
    q?: string;
    sort?: string;
  },
): Promise<AgentListingRow[]> {
  const db = getDb();
  const conditions = [eq(listings.agentId, agentId)];

  const validStatuses = new Set([
    "draft",
    "pending",
    "active",
    "paused",
    "sold",
    "rejected",
    "expired",
  ]);
  if (filters?.status && validStatuses.has(filters.status)) {
    conditions.push(eq(listings.status, filters.status as AgentListingRow["status"]));
  }

  if (filters?.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    conditions.push(or(ilike(listings.title, pattern), ilike(listings.city, pattern))!);
  }

  let orderByClause = desc(listings.updatedAt);
  if (filters?.sort === "views_desc") orderByClause = desc(listings.viewsCount);
  else if (filters?.sort === "price_desc") orderByClause = desc(listings.price);
  else if (filters?.sort === "price_asc") orderByClause = asc(listings.price);

  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      status: listings.status,
      rejectReason: listings.rejectReason,
      offerType: listings.offerType,
      category: listings.category,
      city: listings.city,
      district: listings.district,
      price: listings.price,
      priceUnit: listings.priceUnit,
      priceOnRequest: listings.priceOnRequest,
      usableArea: listings.usableArea,
      viewsCount: listings.viewsCount,
      favoritesCount: listings.favoritesCount,
      expiresAt: listings.expiresAt,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(200);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const covers = await db
    .select({
      listingId: listingImages.listingId,
      storageKey: listingImages.storageKey,
      isCover: listingImages.isCover,
      sortOrder: listingImages.sortOrder,
    })
    .from(listingImages)
    .where(inArray(listingImages.listingId, ids))
    .orderBy(desc(listingImages.isCover), asc(listingImages.sortOrder));

  const coverMap = new Map<string, string>();
  for (const c of covers) {
    if (!coverMap.has(c.listingId)) {
      coverMap.set(c.listingId, c.storageKey);
    }
  }

  return rows.map((r) => ({
    ...r,
    price: r.price !== null ? Number(r.price) : null,
    usableArea: r.usableArea !== null ? Number(r.usableArea) : null,
    coverKey: coverMap.get(r.id) ?? null,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export interface EditableListingData {
  id: string;
  slug: string;
  status: AgentListingRow["status"];
  rejectReason: string | null;
  offerType: "sale" | "rent";
  category: "flat" | "house" | "land" | "commercial" | "other";
  subtype: string | null;
  disposition: string | null;
  locationId: number;
  locationName: string;
  city: string;
  district: string | null;
  street: string | null;
  houseNumber: string | null;
  zip: string | null;
  lat: number;
  lng: number;
  showExactLocation: boolean;
  usableArea: number | null;
  landArea: number | null;
  builtArea: number | null;
  floor: number | null;
  floorsTotal: number | null;
  yearBuilt: number | null;
  lastRenovation: number | null;
  buildingType: string | null;
  condition: string | null;
  ownership: string | null;
  energyClass: string | null;
  furnished: string | null;
  amenities: string[];
  availableFrom: string | null;
  title: string;
  description: string;
  price: number | null;
  priceUnit: "total" | "per_month" | "per_m2_month";
  priceNegotiable: boolean;
  priceOnRequest: boolean;
  feesMonthly: number | null;
  deposit: number | null;
  images: Array<{
    id: string;
    storageKey: string;
    blurDataUrl: string;
    alt: string;
    sortOrder: number;
    isCover: boolean;
  }>;
}

export async function getAgentListingForEdit(
  listingId: string,
): Promise<EditableListingData | null> {
  const db = getDb();
  const [row] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);

  if (!row) return null;

  const [[loc], imgs] = await Promise.all([
    db
      .select({ name: locations.name })
      .from(locations)
      .where(eq(locations.id, row.locationId))
      .limit(1),
    db
      .select({
        id: listingImages.id,
        storageKey: listingImages.storageKey,
        blurDataUrl: listingImages.blurDataUrl,
        alt: listingImages.alt,
        sortOrder: listingImages.sortOrder,
        isCover: listingImages.isCover,
      })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .orderBy(asc(listingImages.sortOrder), desc(listingImages.isCover)),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    rejectReason: row.rejectReason,
    offerType: row.offerType,
    category: row.category,
    subtype: row.subtype,
    disposition: row.disposition,
    locationId: row.locationId,
    locationName: loc?.name ?? row.city,
    city: row.city,
    district: row.district,
    street: row.street,
    houseNumber: row.houseNumber,
    zip: row.zip,
    lat: row.lat,
    lng: row.lng,
    showExactLocation: row.showExactLocation,
    usableArea: row.usableArea !== null ? Number(row.usableArea) : null,
    landArea: row.landArea !== null ? Number(row.landArea) : null,
    builtArea: row.builtArea !== null ? Number(row.builtArea) : null,
    floor: row.floor,
    floorsTotal: row.floorsTotal,
    yearBuilt: row.yearBuilt,
    lastRenovation: row.lastRenovation,
    buildingType: row.buildingType,
    condition: row.condition,
    ownership: row.ownership,
    energyClass: row.energyClass,
    furnished: row.furnished,
    amenities: row.amenities,
    availableFrom: row.availableFrom,
    title: row.title,
    description: row.description,
    price: row.price !== null ? Number(row.price) : null,
    priceUnit: row.priceUnit,
    priceNegotiable: row.priceNegotiable,
    priceOnRequest: row.priceOnRequest,
    feesMonthly: row.feesMonthly !== null ? Number(row.feesMonthly) : null,
    deposit: row.deposit !== null ? Number(row.deposit) : null,
    images: imgs,
  };
}

export async function createDraftListing(
  agentId: string,
  input: DraftPatchInput,
): Promise<{ id: string; slug: string }> {
  const db = getDb();

  // Výchozí lokalita (Praha) pokud ještě nebyla vybrána v kroku 1
  const [[defaultLoc], [profile]] = await Promise.all([
    input.locationId
      ? db
          .select({
            id: locations.id,
            name: locations.name,
            lat: locations.lat,
            lng: locations.lng,
          })
          .from(locations)
          .where(eq(locations.id, input.locationId))
          .limit(1)
      : db
          .select({
            id: locations.id,
            name: locations.name,
            lat: locations.lat,
            lng: locations.lng,
          })
          .from(locations)
          .where(eq(locations.slug, "praha"))
          .limit(1),
    db
      .select({ agencyId: agentProfiles.agencyId })
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, agentId))
      .limit(1),
  ]);

  let loc = defaultLoc;
  if (!loc) {
    const [anyLoc] = await db
      .select({ id: locations.id, name: locations.name, lat: locations.lat, lng: locations.lng })
      .from(locations)
      .limit(1);
    loc = anyLoc;
  }

  const offerType = input.offerType ?? "sale";
  const category = input.category ?? "flat";
  const city = input.city ?? loc?.name ?? "Praha";
  const slug = generateListingSlug({
    category,
    disposition: input.disposition ?? null,
    locationName: city,
    area: input.usableArea ?? null,
    suffix: Math.random().toString(36).slice(2, 8).padEnd(6, "x"),
  });

  const [inserted] = await db
    .insert(listings)
    .values({
      slug,
      agentId,
      agencyId: profile?.agencyId ?? null,
      status: "draft",
      offerType,
      category,
      subtype: input.subtype ?? null,
      disposition: input.disposition ?? null,
      title: input.title?.trim() || "Koncept inzerátu",
      description: input.description?.trim() || "",
      price:
        input.price !== null && input.price !== undefined ? String(Math.round(input.price)) : null,
      priceUnit: input.priceUnit ?? (offerType === "rent" ? "per_month" : "total"),
      priceNegotiable: input.priceNegotiable ?? false,
      priceOnRequest: input.priceOnRequest ?? false,
      feesMonthly:
        input.feesMonthly !== null && input.feesMonthly !== undefined
          ? String(Math.round(input.feesMonthly))
          : null,
      deposit:
        input.deposit !== null && input.deposit !== undefined
          ? String(Math.round(input.deposit))
          : null,
      locationId: loc!.id,
      city,
      district: input.district ?? null,
      street: input.street ?? null,
      houseNumber: input.houseNumber ?? null,
      zip: input.zip ?? null,
      lat: input.lat ?? loc!.lat,
      lng: input.lng ?? loc!.lng,
      showExactLocation: input.showExactLocation ?? false,
      usableArea:
        input.usableArea !== null && input.usableArea !== undefined
          ? String(input.usableArea)
          : null,
      landArea:
        input.landArea !== null && input.landArea !== undefined ? String(input.landArea) : null,
      builtArea:
        input.builtArea !== null && input.builtArea !== undefined ? String(input.builtArea) : null,
      floor: input.floor ?? null,
      floorsTotal: input.floorsTotal ?? null,
      yearBuilt: input.yearBuilt ?? null,
      lastRenovation: input.lastRenovation ?? null,
      buildingType: input.buildingType ?? null,
      condition: input.condition ?? null,
      ownership: input.ownership ?? null,
      energyClass: input.energyClass ?? null,
      furnished: input.furnished ?? null,
      amenities: input.amenities ?? [],
      availableFrom: input.availableFrom ?? null,
    })
    .returning({ id: listings.id, slug: listings.slug });

  return inserted!;
}

export async function updateAgentListing(
  listingId: string,
  input: DraftPatchInput,
): Promise<{ id: string; slug: string; status: string }> {
  const db = getDb();
  const [existing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);

  if (!existing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const nextPriceNum =
    input.price !== undefined
      ? input.price !== null
        ? Math.round(input.price)
        : null
      : existing.price !== null
        ? Number(existing.price)
        : null;
  const prevPriceNum = existing.price !== null ? Number(existing.price) : null;

  // Pokud se změní cena aktivního inzerátu, zapíšeme předchozí cenu do historie (AC-6.6 / QA C7)
  if (
    existing.status === "active" &&
    prevPriceNum !== null &&
    nextPriceNum !== null &&
    prevPriceNum !== nextPriceNum
  ) {
    await db.insert(listingPriceHistory).values({
      listingId,
      price: String(prevPriceNum),
      changedAt: new Date(),
    });
  }

  const nextStatus = input.submitForReview
    ? existing.status === "active"
      ? "active"
      : "pending"
    : existing.status;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    status: nextStatus,
  };

  if (input.submitForReview && existing.status === "rejected") {
    updateData.rejectReason = null;
  }

  if (input.offerType !== undefined) updateData.offerType = input.offerType;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.subtype !== undefined) updateData.subtype = input.subtype;
  if (input.disposition !== undefined) updateData.disposition = input.disposition;
  if (input.locationId !== undefined) updateData.locationId = input.locationId;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.district !== undefined) updateData.district = input.district;
  if (input.street !== undefined) updateData.street = input.street;
  if (input.houseNumber !== undefined) updateData.houseNumber = input.houseNumber;
  if (input.zip !== undefined) updateData.zip = input.zip;
  if (input.lat !== undefined) updateData.lat = input.lat;
  if (input.lng !== undefined) updateData.lng = input.lng;
  if (input.showExactLocation !== undefined) updateData.showExactLocation = input.showExactLocation;
  if (input.usableArea !== undefined)
    updateData.usableArea = input.usableArea !== null ? String(input.usableArea) : null;
  if (input.landArea !== undefined)
    updateData.landArea = input.landArea !== null ? String(input.landArea) : null;
  if (input.builtArea !== undefined)
    updateData.builtArea = input.builtArea !== null ? String(input.builtArea) : null;
  if (input.floor !== undefined) updateData.floor = input.floor;
  if (input.floorsTotal !== undefined) updateData.floorsTotal = input.floorsTotal;
  if (input.yearBuilt !== undefined) updateData.yearBuilt = input.yearBuilt;
  if (input.lastRenovation !== undefined) updateData.lastRenovation = input.lastRenovation;
  if (input.buildingType !== undefined) updateData.buildingType = input.buildingType;
  if (input.condition !== undefined) updateData.condition = input.condition;
  if (input.ownership !== undefined) updateData.ownership = input.ownership;
  if (input.energyClass !== undefined) updateData.energyClass = input.energyClass;
  if (input.furnished !== undefined) updateData.furnished = input.furnished;
  if (input.amenities !== undefined) updateData.amenities = input.amenities;
  if (input.availableFrom !== undefined) updateData.availableFrom = input.availableFrom;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.price !== undefined)
    updateData.price = input.price !== null ? String(Math.round(input.price)) : null;
  if (input.priceUnit !== undefined) updateData.priceUnit = input.priceUnit;
  if (input.priceNegotiable !== undefined) updateData.priceNegotiable = input.priceNegotiable;
  if (input.priceOnRequest !== undefined) updateData.priceOnRequest = input.priceOnRequest;
  if (input.feesMonthly !== undefined)
    updateData.feesMonthly =
      input.feesMonthly !== null ? String(Math.round(input.feesMonthly)) : null;
  if (input.deposit !== undefined)
    updateData.deposit = input.deposit !== null ? String(Math.round(input.deposit)) : null;

  const [updated] = await db
    .update(listings)
    .set(updateData)
    .where(eq(listings.id, listingId))
    .returning({ id: listings.id, slug: listings.slug, status: listings.status });

  return updated!;
}

export async function duplicateAgentListing(
  agentId: string,
  sourceListingId: string,
): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const [src] = await db.select().from(listings).where(eq(listings.id, sourceListingId)).limit(1);
  if (!src) throw new Error("LISTING_NOT_FOUND");

  const newSlug = generateListingSlug({
    category: src.category,
    disposition: src.disposition,
    locationName: src.district ?? src.city,
    area: src.usableArea !== null ? Number(src.usableArea) : null,
    suffix: Math.random().toString(36).slice(2, 8).padEnd(6, "x"),
  });

  const [copy] = await db
    .insert(listings)
    .values({
      slug: newSlug,
      agentId,
      agencyId: src.agencyId,
      status: "draft",
      offerType: src.offerType,
      category: src.category,
      subtype: src.subtype,
      title: `${src.title} (kopie)`.slice(0, 140),
      description: src.description,
      price: src.price,
      priceUnit: src.priceUnit,
      priceNegotiable: src.priceNegotiable,
      priceOnRequest: src.priceOnRequest,
      feesMonthly: src.feesMonthly,
      deposit: src.deposit,
      street: src.street,
      houseNumber: src.houseNumber,
      zip: src.zip,
      locationId: src.locationId,
      city: src.city,
      district: src.district,
      lat: src.lat,
      lng: src.lng,
      showExactLocation: src.showExactLocation,
      usableArea: src.usableArea,
      landArea: src.landArea,
      builtArea: src.builtArea,
      floor: src.floor,
      floorsTotal: src.floorsTotal,
      yearBuilt: src.yearBuilt,
      lastRenovation: src.lastRenovation,
      disposition: src.disposition,
      buildingType: src.buildingType,
      condition: src.condition,
      ownership: src.ownership,
      energyClass: src.energyClass,
      furnished: src.furnished,
      amenities: src.amenities,
      availableFrom: src.availableFrom,
    })
    .returning({ id: listings.id, slug: listings.slug });

  const srcImages = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, sourceListingId))
    .orderBy(asc(listingImages.sortOrder));

  if (srcImages.length > 0) {
    await db.insert(listingImages).values(
      srcImages.map((img) => ({
        listingId: copy!.id,
        storageKey: img.storageKey,
        width: img.width,
        height: img.height,
        blurDataUrl: img.blurDataUrl,
        alt: img.alt,
        sortOrder: img.sortOrder,
        isCover: img.isCover,
      })),
    );
  }

  return copy!;
}

export async function transitionAgentListingStatus(
  listingId: string,
  action: "pause" | "resume" | "sold" | "extend",
): Promise<{ status: string }> {
  const db = getDb();
  const now = new Date();
  const inSixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  let patch: Record<string, unknown>;
  if (action === "pause") {
    patch = { status: "paused", updatedAt: now };
  } else if (action === "resume") {
    patch = { status: "active", updatedAt: now, expiresAt: inSixtyDays };
  } else if (action === "sold") {
    patch = { status: "sold", updatedAt: now };
  } else {
    patch = { status: "active", expiresAt: inSixtyDays, updatedAt: now };
  }

  const [updated] = await db
    .update(listings)
    .set(patch)
    .where(eq(listings.id, listingId))
    .returning({ status: listings.status });

  return { status: updated!.status };
}

export async function deleteAgentListingHard(listingId: string): Promise<void> {
  const db = getDb();
  const imgs = await db
    .select({ storageKey: listingImages.storageKey })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));

  await db.delete(listings).where(eq(listings.id, listingId));

  // Smazat nahrané soubory z disku (pokud nejsou sdílené jinou kopií)
  for (const img of imgs) {
    if (!img.storageKey.startsWith("listings/")) continue;
    const [stillReferenced] = await db
      .select({ id: listingImages.id })
      .from(listingImages)
      .where(eq(listingImages.storageKey, img.storageKey))
      .limit(1);
    if (!stillReferenced) {
      await deleteStoredListingImage(img.storageKey);
    }
  }
}

export async function addListingImageRecord(input: {
  listingId: string;
  storageKey: string;
  width: number;
  height: number;
  blurDataUrl: string;
  alt: string;
}) {
  const db = getDb();
  const existing = await db
    .select({ id: listingImages.id, sortOrder: listingImages.sortOrder })
    .from(listingImages)
    .where(eq(listingImages.listingId, input.listingId))
    .orderBy(desc(listingImages.sortOrder));

  const nextSort = existing.length > 0 ? (existing[0]!.sortOrder ?? 0) + 1 : 0;
  const isCover = existing.length === 0;

  const [row] = await db
    .insert(listingImages)
    .values({
      listingId: input.listingId,
      storageKey: input.storageKey,
      width: input.width,
      height: input.height,
      blurDataUrl: input.blurDataUrl,
      alt: input.alt,
      sortOrder: nextSort,
      isCover,
    })
    .returning();

  return row!;
}

export async function countListingImages(listingId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));
  return row?.count ?? 0;
}

export async function reorderListingImages(
  listingId: string,
  orderedIds: string[],
  coverId?: string,
): Promise<void> {
  const db = getDb();
  const effectiveCover = coverId ?? orderedIds[0];

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]!;
      await tx
        .update(listingImages)
        .set({
          sortOrder: i,
          isCover: id === effectiveCover,
        })
        .where(and(eq(listingImages.id, id), eq(listingImages.listingId, listingId)));
    }
  });
}

export async function deleteListingImage(listingId: string, imageId: string): Promise<boolean> {
  const db = getDb();
  const [deleted] = await db
    .delete(listingImages)
    .where(and(eq(listingImages.id, imageId), eq(listingImages.listingId, listingId)))
    .returning({ storageKey: listingImages.storageKey, isCover: listingImages.isCover });

  if (!deleted) return false;

  if (deleted.isCover) {
    const [firstRemaining] = await db
      .select({ id: listingImages.id })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .orderBy(asc(listingImages.sortOrder))
      .limit(1);
    if (firstRemaining) {
      await db
        .update(listingImages)
        .set({ isCover: true })
        .where(eq(listingImages.id, firstRemaining.id));
    }
  }

  if (deleted.storageKey.startsWith("listings/")) {
    const [stillUsed] = await db
      .select({ id: listingImages.id })
      .from(listingImages)
      .where(eq(listingImages.storageKey, deleted.storageKey))
      .limit(1);
    if (!stillUsed) {
      await deleteStoredListingImage(deleted.storageKey);
    }
  }

  return true;
}
