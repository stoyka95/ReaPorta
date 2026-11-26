import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listings, savedSearches, users } from "@/db/schema";
import { buildListingWhere } from "@/lib/search/build-query";
import { CATEGORY_ENUM_TO_URL, OFFER_ENUM_TO_URL, searchFiltersSchema } from "@/lib/search/schema";
import { formatPrice } from "@/lib/format";
import { buildSavedSearchAlertEmail, queueEmail } from "@/lib/email";

export function buildSearchUrlFromParams(params: Record<string, unknown>): string {
  const parsed = searchFiltersSchema.safeParse(params);
  if (!parsed.success) return "/prodej/vse";

  const p = parsed.data;
  const offerSegment = p.offerType ? OFFER_ENUM_TO_URL[p.offerType] : "prodej";
  const categorySegment = p.category ? CATEGORY_ENUM_TO_URL[p.category] : "vse";
  const firstLoc = p.locations[0];

  const basePath = firstLoc
    ? `/${offerSegment}/${categorySegment}/${firstLoc}`
    : `/${offerSegment}/${categorySegment}`;

  const sp = new URLSearchParams();
  if (p.locations.length > 1) sp.set("loc", p.locations.slice(1).join(","));
  if (p.priceMin !== undefined) sp.set("cenaOd", String(p.priceMin));
  if (p.priceMax !== undefined) sp.set("cenaDo", String(p.priceMax));
  if (p.usableAreaMin !== undefined) sp.set("plochaOd", String(p.usableAreaMin));
  if (p.usableAreaMax !== undefined) sp.set("plochaDo", String(p.usableAreaMax));
  if (p.dispositions.length > 0) sp.set("dispozice", p.dispositions.join(","));
  if (p.amenities.length > 0) sp.set("vybaveni", p.amenities.join(","));
  if (p.q) sp.set("q", p.q);
  if (p.sort && p.sort !== "newest") sp.set("razeni", p.sort);

  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function isSearchDue(
  frequency: "instant" | "daily" | "weekly" | "off",
  lastNotifiedAt: Date | null,
  now: Date,
): boolean {
  if (frequency === "off") return false;
  if (!lastNotifiedAt) return true;
  if (frequency === "instant") return true;

  const elapsedMs = now.getTime() - lastNotifiedAt.getTime();
  if (frequency === "daily") return elapsedMs >= 24 * 60 * 60 * 1000;
  if (frequency === "weekly") return elapsedMs >= 7 * 24 * 60 * 60 * 1000;
  return false;
}

export interface RunAlertsResult {
  checked: number;
  notified: number;
  totalListingsMatched: number;
}

export async function runSavedSearchAlerts(options?: {
  now?: Date;
  forceAll?: boolean;
}): Promise<RunAlertsResult> {
  const db = getDb();
  const now = options?.now ?? new Date();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const searches = await db
    .select({
      id: savedSearches.id,
      name: savedSearches.name,
      params: savedSearches.params,
      frequency: savedSearches.frequency,
      lastNotifiedAt: savedSearches.lastNotifiedAt,
      createdAt: savedSearches.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(savedSearches)
    .innerJoin(users, eq(savedSearches.userId, users.id))
    .where(and(isNull(users.deletedAt), isNull(users.blockedAt)));

  let checked = 0;
  let notified = 0;
  let totalListingsMatched = 0;

  for (const s of searches) {
    if (s.frequency === "off") continue;
    if (!options?.forceAll && !isSearchDue(s.frequency, s.lastNotifiedAt, now)) {
      continue;
    }

    checked += 1;
    const rawParams = (s.params ?? {}) as Record<string, unknown>;
    const parsed = searchFiltersSchema.safeParse(rawParams);
    if (!parsed.success) continue;

    const since = s.lastNotifiedAt ?? s.createdAt;
    const whereClause = buildListingWhere(parsed.data, {
      includeStatusFilter: true,
      publishedAfter: since,
    });

    const matched = await db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        price: listings.price,
        priceUnit: listings.priceUnit,
        priceOnRequest: listings.priceOnRequest,
        city: listings.city,
        district: listings.district,
      })
      .from(listings)
      .where(whereClause)
      .orderBy(desc(listings.publishedAt))
      .limit(10);

    if (matched.length === 0) {
      continue;
    }

    const searchUrl = `${appUrl}${buildSearchUrlFromParams(rawParams)}`;
    const emailContent = buildSavedSearchAlertEmail({
      userName: s.userName,
      searchName: s.name,
      searchUrl,
      listings: matched.map((m) => ({
        title: m.title,
        priceText: formatPrice(m.price !== null ? Number(m.price) : null, m.priceUnit, {
          priceOnRequest: m.priceOnRequest,
        }),
        location: m.district ?? m.city,
        url: `${appUrl}/nemovitost/${m.slug}`,
      })),
    });

    await queueEmail({
      toEmail: s.userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    await db.update(savedSearches).set({ lastNotifiedAt: now }).where(eq(savedSearches.id, s.id));

    notified += 1;
    totalListingsMatched += matched.length;
  }

  return { checked, notified, totalListingsMatched };
}
