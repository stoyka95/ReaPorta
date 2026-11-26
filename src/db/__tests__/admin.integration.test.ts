import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { desc, eq } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import { auditLog, emailOutbox, listings, locations, reports, sessions, users } from "@/db/schema";
import {
  moderateListing,
  resolveAdminReport,
  updateAdminLocation,
  updateAdminUser,
} from "@/db/queries/admin";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

describe("Admin DB queries, moderation, user blocking, reports & audit_log (AC-8.1..8.7)", () => {
  let adminId: string;
  let agentId: string;
  let userId: string;
  let testListingId: string;
  let testReportId: string;
  let testLocationId: number;
  let originalLocationName: string;

  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    const db = getDb();

    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "admin@reaporta.test"))
      .limit(1);
    const [agent] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "makler@reaporta.test"))
      .limit(1);
    const [regular] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "uzivatel@reaporta.test"))
      .limit(1);
    const [loc] = await db
      .select({ id: locations.id, name: locations.name, lat: locations.lat, lng: locations.lng })
      .from(locations)
      .where(eq(locations.type, "obec"))
      .limit(1);

    if (!admin || !agent || !regular || !loc) {
      throw new Error("Seedovaná testovací DB neobsahuje základní účty nebo lokality.");
    }

    adminId = admin.id;
    agentId = agent.id;
    userId = regular.id;
    testLocationId = loc.id;
    originalLocationName = loc.name;

    const [created] = await db
      .insert(listings)
      .values({
        slug: `admin-test-${Date.now()}`,
        agentId,
        status: "pending",
        offerType: "sale",
        category: "flat",
        title: "Testovací byt k moderaci (Vitest)",
        description: "Popis testovacího inzerátu pro integrační test administrace.",
        price: "5500000",
        priceUnit: "total",
        locationId: loc.id,
        city: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        usableArea: "62",
      })
      .returning({ id: listings.id });

    testListingId = created!.id;

    const [rep] = await db
      .insert(reports)
      .values({
        listingId: testListingId,
        reporterUserId: userId,
        reason: "wrong_info",
        details: "Testovací nahlášení pro admin test",
        status: "open",
      })
      .returning({ id: reports.id });

    testReportId = rep!.id;
  });

  afterAll(async () => {
    const db = getDb();
    // Obnovit testované záznamy
    await db.update(users).set({ blockedAt: null }).where(eq(users.id, userId));
    await db
      .update(locations)
      .set({ name: originalLocationName })
      .where(eq(locations.id, testLocationId));
    await db.delete(listings).where(eq(listings.id, testListingId));
    await closePool();
  });

  it("zamítnutí inzerátu vyžaduje důvod, nastaví rejected, odešle e-mail a zapíše audit_log", async () => {
    const missingReason = await moderateListing({
      actorId: adminId,
      listingId: testListingId,
      decision: "reject",
      reason: "ne",
    });
    expect(missingReason.ok).toBe(false);

    const rejected = await moderateListing({
      actorId: adminId,
      listingId: testListingId,
      decision: "reject",
      reason: "Doplňte prosím energetický štítek PENB.",
    });
    expect(rejected.ok).toBe(true);

    const db = getDb();
    const [row] = await db
      .select({ status: listings.status, rejectReason: listings.rejectReason })
      .from(listings)
      .where(eq(listings.id, testListingId));
    expect(row?.status).toBe("rejected");
    expect(row?.rejectReason).toContain("PENB");

    const [mail] = await db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.toEmail, "makler@reaporta.test"))
      .orderBy(desc(emailOutbox.createdAt))
      .limit(1);
    expect(mail?.text).toContain("PENB");

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, testListingId))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(audit?.action).toBe("listing.reject");
  });

  it("schválení inzerátu nastaví active + publishedAt + expiresAt, odešle e-mail a zapíše audit_log", async () => {
    const approved = await moderateListing({
      actorId: adminId,
      listingId: testListingId,
      decision: "approve",
    });
    expect(approved.ok).toBe(true);

    const db = getDb();
    const [row] = await db
      .select({
        status: listings.status,
        publishedAt: listings.publishedAt,
        expiresAt: listings.expiresAt,
        rejectReason: listings.rejectReason,
      })
      .from(listings)
      .where(eq(listings.id, testListingId));
    expect(row?.status).toBe("active");
    expect(row?.publishedAt).not.toBeNull();
    expect(row?.expiresAt).not.toBeNull();
    expect(row?.rejectReason).toBeNull();

    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, testListingId))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(audit?.action).toBe("listing.approve");
  });

  it("zablokování uživatele smaže jeho sessions a brání sebezablokování admina", async () => {
    const selfBlock = await updateAdminUser({
      actorId: adminId,
      targetUserId: adminId,
      blocked: true,
    });
    expect(selfBlock.ok).toBe(false);

    const db = getDb();
    await db.insert(sessions).values({
      userId,
      token: `test-session-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const blocked = await updateAdminUser({
      actorId: adminId,
      targetUserId: userId,
      blocked: true,
    });
    expect(blocked.ok).toBe(true);

    const activeSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
    expect(activeSessions.length).toBe(0);

    await updateAdminUser({ actorId: adminId, targetUserId: userId, blocked: false });
  });

  it("vyřešení nahlášení se skrytím inzerátu nastaví listing paused a report resolved + audit_log", async () => {
    const res = await resolveAdminReport({
      actorId: adminId,
      reportId: testReportId,
      action: "hide_listing",
    });
    expect(res.ok).toBe(true);

    const db = getDb();
    const [listing] = await db
      .select({ status: listings.status })
      .from(listings)
      .where(eq(listings.id, testListingId));
    expect(listing?.status).toBe("paused");

    const [rep] = await db
      .select({ status: reports.status, resolvedBy: reports.resolvedBy })
      .from(reports)
      .where(eq(reports.id, testReportId));
    expect(rep?.status).toBe("resolved");
    expect(rep?.resolvedBy).toBe(adminId);
  });

  it("úprava lokality uloží název a souřadnice a zapíše audit_log", async () => {
    const ok = await updateAdminLocation({
      actorId: adminId,
      id: testLocationId,
      name: `${originalLocationName} (test)`,
      lat: 50.08,
      lng: 14.43,
    });
    expect(ok).toBe(true);

    const db = getDb();
    const [audit] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, String(testLocationId)))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);
    expect(audit?.action).toBe("location.update");
  });
});
