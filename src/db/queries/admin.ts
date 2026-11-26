import { and, asc, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  agencies,
  agentProfiles,
  auditLog,
  favorites,
  inquiries,
  listingImages,
  listings,
  locations,
  reports,
  sessions,
  users,
} from "@/db/schema";
import { buildModerationResultEmail, queueEmail } from "@/lib/email";
import { slugify } from "@/lib/slug";

export async function logAuditAction(params: {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(auditLog).values({
    actorId: params.actorId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    meta: params.meta ?? null,
  });
}

export async function getAdminSidebarCounts(): Promise<{
  pendingListings: number;
  openReports: number;
}> {
  const db = getDb();
  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(listings)
    .where(eq(listings.status, "pending"));
  const [reportsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));

  return {
    pendingListings: pendingRow?.count ?? 0,
    openReports: reportsRow?.count ?? 0,
  };
}

export interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  meta: Record<string, unknown> | null;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
}

export interface AdminOverviewData {
  pendingListings: number;
  openReports: number;
  newUsers30d: number;
  activeListings: number;
  totalUsers: number;
  totalAgencies: number;
  recentAudit: AuditLogRow[];
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const db = getDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    pendingRow,
    reportsRow,
    newUsersRow,
    activeListingsRow,
    totalUsersRow,
    totalAgenciesRow,
    auditRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "pending")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "open")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, thirtyDaysAgo))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "active")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(agencies),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        meta: auditLog.meta,
        createdAt: auditLog.createdAt,
        actorName: users.name,
        actorEmail: users.email,
      })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorId))
      .orderBy(desc(auditLog.createdAt))
      .limit(30),
  ]);

  return {
    pendingListings: pendingRow[0]?.count ?? 0,
    openReports: reportsRow[0]?.count ?? 0,
    newUsers30d: newUsersRow[0]?.count ?? 0,
    activeListings: activeListingsRow[0]?.count ?? 0,
    totalUsers: totalUsersRow[0]?.count ?? 0,
    totalAgencies: totalAgenciesRow[0]?.count ?? 0,
    recentAudit: auditRows,
  };
}

export interface ModerationQueueItem {
  id: string;
  slug: string;
  title: string;
  offerType: "sale" | "rent";
  category: "flat" | "house" | "land" | "commercial" | "other";
  city: string;
  district: string | null;
  price: number | null;
  priceUnit: "total" | "per_month" | "per_m2_month";
  priceOnRequest: boolean;
  usableArea: number | null;
  createdAt: Date;
  updatedAt: Date;
  agentId: string;
  agentName: string;
  agentEmail: string;
  coverKey: string | null;
  imagesCount: number;
}

export async function getPendingModerationQueue(): Promise<ModerationQueueItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      offerType: listings.offerType,
      category: listings.category,
      city: listings.city,
      district: listings.district,
      price: listings.price,
      priceUnit: listings.priceUnit,
      priceOnRequest: listings.priceOnRequest,
      usableArea: listings.usableArea,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
      agentId: listings.agentId,
      agentName: users.name,
      agentEmail: users.email,
      coverKey: sql<string | null>`(
        SELECT storage_key FROM listing_images li
        WHERE li.listing_id = ${listings.id}
        ORDER BY li.is_cover DESC, li.sort_order ASC
        LIMIT 1
      )`,
      imagesCount: sql<number>`(
        SELECT count(*)::int FROM listing_images li
        WHERE li.listing_id = ${listings.id}
      )`,
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.agentId))
    .where(eq(listings.status, "pending"))
    .orderBy(asc(listings.updatedAt));

  return rows.map((r) => ({
    ...r,
    price: r.price !== null ? Number(r.price) : null,
    usableArea: r.usableArea !== null ? Number(r.usableArea) : null,
  }));
}

export async function moderateListing(params: {
  actorId: string;
  listingId: string;
  decision: "approve" | "reject";
  reason?: string;
  baseUrl?: string;
}): Promise<
  { ok: true; status: "active" | "rejected"; slug: string } | { ok: false; error: string }
> {
  const db = getDb();
  const [row] = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      status: listings.status,
      agentId: listings.agentId,
      agentName: users.name,
      agentEmail: users.email,
    })
    .from(listings)
    .innerJoin(users, eq(users.id, listings.agentId))
    .where(eq(listings.id, params.listingId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Inzerát nebyl nalezen." };
  }

  const origin = params.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (params.decision === "approve") {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    await db
      .update(listings)
      .set({
        status: "active",
        rejectReason: null,
        publishedAt: now,
        expiresAt,
        updatedAt: now,
      })
      .where(eq(listings.id, row.id));

    const mail = buildModerationResultEmail({
      agentName: row.agentName,
      listingTitle: row.title,
      listingUrl: `${origin}/nemovitost/${row.slug}`,
      approved: true,
    });
    await queueEmail({ toEmail: row.agentEmail, ...mail });

    await logAuditAction({
      actorId: params.actorId,
      action: "listing.approve",
      entity: "listing",
      entityId: row.id,
      meta: { slug: row.slug, title: row.title, previousStatus: row.status },
    });

    return { ok: true, status: "active", slug: row.slug };
  }

  const trimmedReason = params.reason?.trim() ?? "";
  if (trimmedReason.length < 5) {
    return { ok: false, error: "Uveďte prosím srozumitelný důvod zamítnutí (alespoň 5 znaků)." };
  }

  await db
    .update(listings)
    .set({
      status: "rejected",
      rejectReason: trimmedReason,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, row.id));

  const mail = buildModerationResultEmail({
    agentName: row.agentName,
    listingTitle: row.title,
    listingUrl: `${origin}/dashboard/inzeraty/${row.id}/upravit`,
    approved: false,
    reason: trimmedReason,
  });
  await queueEmail({ toEmail: row.agentEmail, ...mail });

  await logAuditAction({
    actorId: params.actorId,
    action: "listing.reject",
    entity: "listing",
    entityId: row.id,
    meta: { slug: row.slug, title: row.title, reason: trimmedReason, previousStatus: row.status },
  });

  return { ok: true, status: "rejected", slug: row.slug };
}

export interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "user" | "agent" | "admin";
  emailVerified: boolean;
  blockedAt: Date | null;
  createdAt: Date;
  listingsCount: number;
  favoritesCount: number;
  inquiriesCount: number;
}

export async function listAdminUsers(search?: string): Promise<AdminUserItem[]> {
  const db = getDb();
  const q = search?.trim();

  const whereClause = q
    ? and(isNull(users.deletedAt), or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)))
    : isNull(users.deletedAt);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      emailVerified: users.emailVerified,
      blockedAt: users.blockedAt,
      createdAt: users.createdAt,
      listingsCount:
        sql<number>`(SELECT count(*)::int FROM listings l WHERE l.agent_id = "users"."id")`.as(
          "listings_count",
        ),
      favoritesCount:
        sql<number>`(SELECT count(*)::int FROM favorites f WHERE f.user_id = "users"."id")`.as(
          "favorites_count",
        ),
      inquiriesCount:
        sql<number>`(SELECT count(*)::int FROM inquiries i WHERE i.user_id = "users"."id" OR i.agent_id = "users"."id")`.as(
          "inquiries_count",
        ),
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(100);

  return rows;
}

export async function updateAdminUser(params: {
  actorId: string;
  targetUserId: string;
  role?: "user" | "agent" | "admin";
  blocked?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      blockedAt: users.blockedAt,
    })
    .from(users)
    .where(and(eq(users.id, params.targetUserId), isNull(users.deletedAt)))
    .limit(1);

  if (!target) {
    return { ok: false, error: "Uživatel nebyl nalezen." };
  }

  if (params.targetUserId === params.actorId) {
    if (params.blocked === true) {
      return { ok: false, error: "Nemůžete zablokovat svůj vlastní administrátorský účet." };
    }
    if (params.role && params.role !== "admin") {
      return { ok: false, error: "Nemůžete odebrat roli správce svému vlastnímu účtu." };
    }
  }

  const updateValues: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (params.role !== undefined && params.role !== target.role) {
    updateValues.role = params.role;
  }

  if (params.blocked !== undefined) {
    updateValues.blockedAt = params.blocked ? new Date() : null;
  }

  await db.update(users).set(updateValues).where(eq(users.id, target.id));

  // Při povýšení na makléře zajistit existenci záznamu v agent_profiles
  if (params.role === "agent" || params.role === "admin") {
    const [existingProfile] = await db
      .select({ userId: agentProfiles.userId })
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, target.id))
      .limit(1);
    if (!existingProfile) {
      const baseSlug = slugify(target.name) || "makler";
      const slug = `${baseSlug}-${target.id.slice(0, 6)}`;
      await db.insert(agentProfiles).values({
        userId: target.id,
        displayName: target.name,
        slug,
        emailPublic: target.email,
      });
    }
  }

  // Při zablokování okamžitě ukončit všechny aktivní sessiony uživatele (QA D3)
  if (params.blocked === true) {
    await db.delete(sessions).where(eq(sessions.userId, target.id));
  }

  if (params.role !== undefined && params.role !== target.role) {
    await logAuditAction({
      actorId: params.actorId,
      action: "user.role_change",
      entity: "user",
      entityId: target.id,
      meta: { email: target.email, from: target.role, to: params.role },
    });
  }

  if (params.blocked !== undefined) {
    await logAuditAction({
      actorId: params.actorId,
      action: params.blocked ? "user.block" : "user.unblock",
      entity: "user",
      entityId: target.id,
      meta: { email: target.email, blocked: params.blocked },
    });
  }

  return { ok: true };
}

export interface AdminAgencyItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  agentsCount: number;
  listingsCount: number;
}

export interface AdminAgentAssignmentItem {
  userId: string;
  displayName: string;
  slug: string;
  email: string;
  agencyId: string | null;
  agencyName: string | null;
}

export async function listAdminAgenciesAndAgents(): Promise<{
  agencies: AdminAgencyItem[];
  agents: AdminAgentAssignmentItem[];
}> {
  const db = getDb();

  const [agencyRows, agentRows] = await Promise.all([
    db
      .select({
        id: agencies.id,
        name: agencies.name,
        slug: agencies.slug,
        description: agencies.description,
        website: agencies.website,
        email: agencies.email,
        phone: agencies.phone,
        address: agencies.address,
        agentsCount:
          sql<number>`(SELECT count(*)::int FROM agent_profiles ap WHERE ap.agency_id = "agencies"."id")`.as(
            "agents_count",
          ),
        listingsCount:
          sql<number>`(SELECT count(*)::int FROM listings l WHERE l.agency_id = "agencies"."id" AND l.status = 'active')`.as(
            "listings_count",
          ),
      })
      .from(agencies)
      .orderBy(asc(agencies.name)),
    db
      .select({
        userId: agentProfiles.userId,
        displayName: agentProfiles.displayName,
        slug: agentProfiles.slug,
        email: users.email,
        agencyId: agentProfiles.agencyId,
        agencyName: agencies.name,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(users.id, agentProfiles.userId))
      .leftJoin(agencies, eq(agencies.id, agentProfiles.agencyId))
      .where(isNull(users.deletedAt))
      .orderBy(asc(agentProfiles.displayName)),
  ]);

  return { agencies: agencyRows, agents: agentRows };
}

export async function createAdminAgency(params: {
  actorId: string;
  name: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const baseSlug = slugify(params.name) || "agentura";
  const [existing] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.slug, baseSlug))
    .limit(1);
  const slug = existing ? `${baseSlug}-${Date.now().toString(36).slice(-4)}` : baseSlug;

  const [created] = await db
    .insert(agencies)
    .values({
      name: params.name.trim(),
      slug,
      description: params.description?.trim() || null,
      website: params.website?.trim() || null,
      email: params.email?.trim() || null,
      phone: params.phone?.trim() || null,
      address: params.address?.trim() || null,
    })
    .returning({ id: agencies.id, slug: agencies.slug });

  await logAuditAction({
    actorId: params.actorId,
    action: "agency.create",
    entity: "agency",
    entityId: created!.id,
    meta: { name: params.name.trim(), slug: created!.slug },
  });

  return created!;
}

export async function updateAdminAgency(params: {
  actorId: string;
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}): Promise<boolean> {
  const db = getDb();
  const [updated] = await db
    .update(agencies)
    .set({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      website: params.website?.trim() || null,
      email: params.email?.trim() || null,
      phone: params.phone?.trim() || null,
      address: params.address?.trim() || null,
    })
    .where(eq(agencies.id, params.id))
    .returning({ id: agencies.id });

  if (!updated) return false;

  await logAuditAction({
    actorId: params.actorId,
    action: "agency.update",
    entity: "agency",
    entityId: params.id,
    meta: { name: params.name.trim() },
  });

  return true;
}

export async function deleteAdminAgency(params: { actorId: string; id: string }): Promise<boolean> {
  const db = getDb();
  const [deleted] = await db
    .delete(agencies)
    .where(eq(agencies.id, params.id))
    .returning({ id: agencies.id, name: agencies.name });

  if (!deleted) return false;

  await logAuditAction({
    actorId: params.actorId,
    action: "agency.delete",
    entity: "agency",
    entityId: deleted.id,
    meta: { name: deleted.name },
  });

  return true;
}

export async function assignAgentToAgency(params: {
  actorId: string;
  agentUserId: string;
  agencyId: string | null;
}): Promise<boolean> {
  const db = getDb();
  const [updated] = await db
    .update(agentProfiles)
    .set({ agencyId: params.agencyId })
    .where(eq(agentProfiles.userId, params.agentUserId))
    .returning({ userId: agentProfiles.userId });

  if (!updated) return false;

  await db
    .update(listings)
    .set({ agencyId: params.agencyId })
    .where(eq(listings.agentId, params.agentUserId));

  await logAuditAction({
    actorId: params.actorId,
    action: "agent.assign_agency",
    entity: "agent_profile",
    entityId: params.agentUserId,
    meta: { agencyId: params.agencyId },
  });

  return true;
}

export interface AdminReportItem {
  id: string;
  reason: "fraud" | "duplicate" | "wrong_info" | "sold" | "other";
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt: Date;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  listingStatus: string;
  listingCity: string;
  reporterName: string | null;
  reporterEmail: string | null;
}

export async function listAdminReports(): Promise<AdminReportItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      status: reports.status,
      createdAt: reports.createdAt,
      listingId: listings.id,
      listingSlug: listings.slug,
      listingTitle: listings.title,
      listingStatus: listings.status,
      listingCity: listings.city,
      reporterName: users.name,
      reporterEmail: users.email,
    })
    .from(reports)
    .innerJoin(listings, eq(listings.id, reports.listingId))
    .leftJoin(users, eq(users.id, reports.reporterUserId))
    .orderBy(sql`CASE WHEN ${reports.status} = 'open' THEN 0 ELSE 1 END`, desc(reports.createdAt))
    .limit(100);

  return rows;
}

export async function resolveAdminReport(params: {
  actorId: string;
  reportId: string;
  action: "hide_listing" | "dismiss";
}): Promise<{ ok: true; listingId: string; listingSlug: string } | { ok: false; error: string }> {
  const db = getDb();
  const [row] = await db
    .select({
      id: reports.id,
      listingId: reports.listingId,
      listingSlug: listings.slug,
      listingTitle: listings.title,
      reason: reports.reason,
    })
    .from(reports)
    .innerJoin(listings, eq(listings.id, reports.listingId))
    .where(eq(reports.id, params.reportId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Nahlášení nebylo nalezeno." };
  }

  if (params.action === "hide_listing") {
    await db
      .update(listings)
      .set({ status: "paused", updatedAt: new Date() })
      .where(eq(listings.id, row.listingId));
    await db
      .update(reports)
      .set({ status: "resolved", resolvedBy: params.actorId })
      .where(eq(reports.id, row.id));

    await logAuditAction({
      actorId: params.actorId,
      action: "report.resolve_hide_listing",
      entity: "report",
      entityId: row.id,
      meta: { listingId: row.listingId, listingSlug: row.listingSlug, reason: row.reason },
    });
  } else {
    await db
      .update(reports)
      .set({ status: "dismissed", resolvedBy: params.actorId })
      .where(eq(reports.id, row.id));

    await logAuditAction({
      actorId: params.actorId,
      action: "report.dismiss",
      entity: "report",
      entityId: row.id,
      meta: { listingId: row.listingId, listingSlug: row.listingSlug, reason: row.reason },
    });
  }

  return { ok: true, listingId: row.listingId, listingSlug: row.listingSlug };
}

export interface AdminLocationItem {
  id: number;
  parentId: number | null;
  type: "kraj" | "okres" | "obec" | "cast";
  name: string;
  slug: string;
  fullSlug: string;
  lat: number;
  lng: number;
  population: number;
  listingsCount: number;
}

export async function listAdminLocations(params?: {
  search?: string;
  type?: "kraj" | "okres" | "obec" | "cast" | "all";
}): Promise<AdminLocationItem[]> {
  const db = getDb();
  const conditions = [];
  const q = params?.search?.trim();

  if (q) {
    conditions.push(or(ilike(locations.name, `%${q}%`), ilike(locations.fullSlug, `%${q}%`)));
  }
  if (params?.type && params.type !== "all") {
    conditions.push(eq(locations.type, params.type));
  }

  const rows = await db
    .select({
      id: locations.id,
      parentId: locations.parentId,
      type: locations.type,
      name: locations.name,
      slug: locations.slug,
      fullSlug: locations.fullSlug,
      lat: locations.lat,
      lng: locations.lng,
      population: locations.population,
      listingsCount: sql<number>`(SELECT count(*)::int FROM listings l WHERE l.location_id = ${locations.id})`,
    })
    .from(locations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(locations.type), desc(locations.population), asc(locations.name))
    .limit(120);

  return rows;
}

export async function updateAdminLocation(params: {
  actorId: string;
  id: number;
  name: string;
  lat: number;
  lng: number;
}): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select({ id: locations.id, name: locations.name, lat: locations.lat, lng: locations.lng })
    .from(locations)
    .where(eq(locations.id, params.id))
    .limit(1);

  if (!existing) return false;

  await db
    .update(locations)
    .set({
      name: params.name.trim(),
      lat: params.lat,
      lng: params.lng,
    })
    .where(eq(locations.id, params.id));

  await logAuditAction({
    actorId: params.actorId,
    action: "location.update",
    entity: "location",
    entityId: String(params.id),
    meta: {
      previous: { name: existing.name, lat: existing.lat, lng: existing.lng },
      next: { name: params.name.trim(), lat: params.lat, lng: params.lng },
    },
  });

  return true;
}

// Re-export unused schema ref helpers check avoided — listingImages/favorites/inquiries used cleanly via subqueries
void listingImages;
void favorites;
void inquiries;
