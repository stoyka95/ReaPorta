import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  favorites,
  inquiries,
  listingImages,
  listingPriceHistory,
  listings,
  savedSearches,
  sessions,
  users,
} from "@/db/schema";
import type { ListingCardItem } from "@/db/queries/listings";

export type SavedSearchFrequency = "instant" | "daily" | "weekly" | "off";

export interface FavoriteListingEntry {
  listing: ListingCardItem;
  savedAt: Date;
  status: string;
  priceChangeSinceSaved: number | null;
}

export interface SavedSearchItem {
  id: string;
  name: string;
  params: Record<string, unknown>;
  frequency: SavedSearchFrequency;
  lastNotifiedAt: Date | null;
  createdAt: Date;
}

export interface UserInquiryItem {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  message: string;
  status: string;
  createdAt: Date;
}

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  return rows.map((r) => r.listingId);
}

export async function toggleUserFavorite(
  userId: string,
  listingId: string,
): Promise<{ favorited: boolean }> {
  const db = getDb();

  // Ověř, že inzerát existuje
  const [existsListing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!existsListing) {
    throw new Error("LISTING_NOT_FOUND");
  }

  const [existing] = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)))
    .limit(1);

  if (existing) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
    await db
      .update(listings)
      .set({
        favoritesCount: sql`GREATEST(${listings.favoritesCount} - 1, 0)`,
      })
      .where(eq(listings.id, listingId));
    return { favorited: false };
  }

  await db.insert(favorites).values({ userId, listingId }).onConflictDoNothing();
  await db
    .update(listings)
    .set({
      favoritesCount: sql`${listings.favoritesCount} + 1`,
    })
    .where(eq(listings.id, listingId));
  return { favorited: true };
}

export async function addUserFavorite(userId: string, listingId: string): Promise<void> {
  const db = getDb();
  const [existsListing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!existsListing) return;

  const inserted = await db
    .insert(favorites)
    .values({ userId, listingId })
    .onConflictDoNothing()
    .returning({ listingId: favorites.listingId });

  if (inserted.length > 0) {
    await db
      .update(listings)
      .set({ favoritesCount: sql`${listings.favoritesCount} + 1` })
      .where(eq(listings.id, listingId));
  }
}

export async function getUserFavoritesWithStatus(userId: string): Promise<FavoriteListingEntry[]> {
  const db = getDb();

  const rows = await db
    .select({
      savedAt: favorites.createdAt,
      id: listings.id,
      slug: listings.slug,
      status: listings.status,
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
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  if (rows.length === 0) return [];

  const listingIds = rows.map((r) => r.id);

  const [imageRows, historyRows] = await Promise.all([
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
      .where(inArray(listingImages.listingId, listingIds))
      .orderBy(desc(listingImages.isCover), listingImages.sortOrder),
    db
      .select({
        listingId: listingPriceHistory.listingId,
        price: listingPriceHistory.price,
        changedAt: listingPriceHistory.changedAt,
      })
      .from(listingPriceHistory)
      .where(inArray(listingPriceHistory.listingId, listingIds))
      .orderBy(desc(listingPriceHistory.changedAt)),
  ]);

  const imagesByListing = new Map<string, ListingCardItem["images"]>();
  for (const img of imageRows) {
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

  const historyByListing = new Map<string, Array<{ price: number; changedAt: Date }>>();
  for (const h of historyRows) {
    const arr = historyByListing.get(h.listingId) ?? [];
    arr.push({ price: Number(h.price), changedAt: h.changedAt });
    historyByListing.set(h.listingId, arr);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return rows.map((r) => {
    const currentPrice = r.price !== null ? Number(r.price) : null;
    const hist = historyByListing.get(r.id) ?? [];
    // Změna ceny od uložení do oblíbených (nebo poslední pokles ceny)
    let priceChangeSinceSaved: number | null = null;
    if (currentPrice !== null && hist.length > 0) {
      const changedAfterSave = hist.filter((h) => h.changedAt > r.savedAt);
      if (changedAfterSave.length > 0) {
        const previousPrice = changedAfterSave[changedAfterSave.length - 1]!.price;
        if (previousPrice !== currentPrice) {
          priceChangeSinceSaved = currentPrice - previousPrice;
        }
      }
    }

    const isReduced = currentPrice !== null && hist.some((h) => h.price > currentPrice);

    return {
      savedAt: r.savedAt,
      status: r.status,
      priceChangeSinceSaved,
      listing: {
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
        isReduced,
        images: imagesByListing.get(r.id) ?? [],
      },
    };
  });
}

export async function getUserSavedSearches(userId: string): Promise<SavedSearchItem[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    params: (r.params ?? {}) as Record<string, unknown>,
    frequency: r.frequency,
    lastNotifiedAt: r.lastNotifiedAt,
    createdAt: r.createdAt,
  }));
}

export async function createUserSavedSearch(
  userId: string,
  input: {
    name: string;
    params: Record<string, unknown>;
    frequency: SavedSearchFrequency;
  },
): Promise<SavedSearchItem> {
  const db = getDb();
  const [row] = await db
    .insert(savedSearches)
    .values({
      userId,
      name: input.name.trim(),
      params: input.params,
      frequency: input.frequency,
      lastNotifiedAt: new Date(),
    })
    .returning();

  return {
    id: row!.id,
    name: row!.name,
    params: (row!.params ?? {}) as Record<string, unknown>,
    frequency: row!.frequency,
    lastNotifiedAt: row!.lastNotifiedAt,
    createdAt: row!.createdAt,
  };
}

export async function updateUserSavedSearchFrequency(
  userId: string,
  searchId: string,
  frequency: SavedSearchFrequency,
): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(savedSearches)
    .set({ frequency })
    .where(and(eq(savedSearches.id, searchId), eq(savedSearches.userId, userId)))
    .returning({ id: savedSearches.id });
  return updated.length > 0;
}

export async function deleteUserSavedSearch(userId: string, searchId: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.id, searchId), eq(savedSearches.userId, userId)))
    .returning({ id: savedSearches.id });
  return deleted.length > 0;
}

export async function getUserInquiries(userId: string): Promise<UserInquiryItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: inquiries.id,
      listingId: inquiries.listingId,
      listingSlug: listings.slug,
      listingTitle: listings.title,
      message: inquiries.message,
      status: inquiries.status,
      createdAt: inquiries.createdAt,
    })
    .from(inquiries)
    .innerJoin(listings, eq(inquiries.listingId, listings.id))
    .where(eq(inquiries.userId, userId))
    .orderBy(desc(inquiries.createdAt))
    .limit(50);

  return rows;
}

export async function updateUserProfile(
  userId: string,
  input: { name: string; phone?: string | null },
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (tx) => {
    // 1. Anonymizovat poptávky uživatele (dle AC-5.2 / QA B9)
    await tx
      .update(inquiries)
      .set({
        userId: null,
        name: "Smazaný uživatel",
        email: "anonymized@reaporta.invalid",
        phone: null,
      })
      .where(eq(inquiries.userId, userId));

    // 2. Odstranit oblíbené a snížit počítadla
    const favRows = await tx
      .select({ listingId: favorites.listingId })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    if (favRows.length > 0) {
      await tx.delete(favorites).where(eq(favorites.userId, userId));
      const ids = favRows.map((f) => f.listingId);
      await tx
        .update(listings)
        .set({
          favoritesCount: sql`GREATEST(${listings.favoritesCount} - 1, 0)`,
        })
        .where(inArray(listings.id, ids));
    }

    // 3. Smazat uložená hledání a aktivní relace
    await tx.delete(savedSearches).where(eq(savedSearches.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));

    // 4. Soft delete + anonymizace uživatele
    await tx
      .update(users)
      .set({
        email: `deleted-${userId}@reaporta.invalid`,
        name: "Smazaný uživatel",
        phone: null,
        avatarKey: null,
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  });
}

export async function countListingsPublishedSince(since: Date): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.status, "active"), gt(listings.publishedAt, since)));
  return row?.count ?? 0;
}
