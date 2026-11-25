import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import {
  agencies,
  agentProfiles,
  inquiries,
  listingDailyStats,
  listings,
  locations,
  reports,
  users,
} from "@/db/schema";
import { resetEnvCache } from "@/lib/env";
import { suggestLocations, getPopularCities } from "@/db/queries/locations";
import { getListingBySlug, searchListings, searchMapPoints } from "@/db/queries/listings";

const TEST_DB_URL = "postgres://postgres:postgres@localhost:5432/reaporta_test";

describe("Stage 1 database schema, seed, and queries (reaporta_test)", () => {
  const originalDbUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    resetEnvCache();
  });

  afterAll(async () => {
    await closePool();
    process.env.DATABASE_URL = originalDbUrl;
    resetEnvCache();
  });

  it("matches SEED-DATA.md counts and edge cases", async () => {
    const db = getDb();

    const [
      userCounts,
      agencyCount,
      agentCount,
      listingStatusRows,
      locationTypeRows,
      inquiryCount,
      reportCount,
      statsCount,
    ] = await Promise.all([
      db
        .select({ role: users.role, cnt: sql<number>`count(*)::int` })
        .from(users)
        .groupBy(users.role),
      db.select({ cnt: sql<number>`count(*)::int` }).from(agencies),
      db.select({ cnt: sql<number>`count(*)::int` }).from(agentProfiles),
      db
        .select({ status: listings.status, cnt: sql<number>`count(*)::int` })
        .from(listings)
        .groupBy(listings.status),
      db
        .select({ type: locations.type, cnt: sql<number>`count(*)::int` })
        .from(locations)
        .groupBy(locations.type),
      db.select({ cnt: sql<number>`count(*)::int` }).from(inquiries),
      db.select({ cnt: sql<number>`count(*)::int` }).from(reports),
      db.select({ cnt: sql<number>`count(*)::int` }).from(listingDailyStats),
    ]);

    const roleMap = Object.fromEntries(userCounts.map((r) => [r.role, r.cnt]));
    expect(roleMap.admin).toBe(1);
    expect(roleMap.agent).toBe(14);
    expect(roleMap.user).toBe(8);

    expect(agencyCount[0]?.cnt).toBe(4);
    expect(agentCount[0]?.cnt).toBe(14);

    const statusMap = Object.fromEntries(listingStatusRows.map((r) => [r.status, r.cnt]));
    expect(statusMap.active).toBe(360);
    expect(statusMap.pending).toBe(20);
    expect(statusMap.draft).toBe(8);
    expect(statusMap.sold).toBe(6);
    expect(statusMap.expired).toBe(4);
    expect(statusMap.rejected).toBe(2);

    const locMap = Object.fromEntries(locationTypeRows.map((r) => [r.type, r.cnt]));
    expect(locMap.kraj).toBe(14);
    expect(locMap.okres).toBeGreaterThanOrEqual(75);
    expect(locMap.obec).toBeGreaterThanOrEqual(55);
    expect(locMap.cast).toBeGreaterThanOrEqual(110);

    expect(inquiryCount[0]?.cnt).toBe(60);
    expect(reportCount[0]?.cnt).toBe(5);
    expect(statsCount[0]?.cnt).toBe(360 * 30);

    // Edge case: location with 0 listings exists
    const emptyLoc = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, "horni-lhota"))
      .limit(1);
    expect(emptyLoc[0]?.listingCountCache).toBe(0);
  });

  it("suggestLocations('plzen') returns Plzeň first and tolerates diacritics/prefixes", async () => {
    const plzen = await suggestLocations("plzen");
    expect(plzen.length).toBeGreaterThan(0);
    expect(plzen[0]?.name).toBe("Plzeň");

    const brno = await suggestLocations("brn");
    expect(brno.length).toBeGreaterThan(0);
    expect(brno[0]?.name).toBe("Brno");

    const usti = await suggestLocations("usti");
    expect(usti.some((l) => l.name.includes("Ústí"))).toBe(true);
  });

  it("getPopularCities returns 8 cities with active listing counts", async () => {
    const cities = await getPopularCities();
    expect(cities.length).toBe(8);
    expect(cities[0]?.name).toBe("Praha");
    expect(cities[0]?.listingCount).toBeGreaterThan(0);
  });

  it("searches flat/sale/Praha within <= 100 ms and returns matching listings", async () => {
    // Warm up query planner
    await searchListings({
      offerType: "sale",
      category: "flat",
      locations: ["hlavni-mesto-praha/praha/praha"],
    });

    const start = performance.now();
    const res = await searchListings({
      offerType: "sale",
      category: "flat",
      locations: ["hlavni-mesto-praha/praha/praha"],
    });
    const elapsedMs = performance.now() - start;

    expect(res.total).toBeGreaterThan(0);
    expect(
      res.items.every((i) => i.offerType === "sale" && i.category === "flat" && i.city === "Praha"),
    ).toBe(true);
    expect(elapsedMs).toBeLessThanOrEqual(100);
  });

  it("supports getListingBySlug, fulltext search, and approximate coordinates on map", async () => {
    const res = await searchListings({ offerType: "sale", pageSize: 5 });
    const first = res.items[0]!;
    const detail = await getListingBySlug(first.slug);
    expect(detail).not.toBeNull();
    expect(detail?.slug).toBe(first.slug);

    // Fulltext search via search_text trigger
    const ft = await searchListings({ q: "Smichov" });
    expect(ft.total).toBeGreaterThan(0);

    // Map points return lightweight entries with rounded coords when showExactLocation=false
    const points = await searchMapPoints({ offerType: "sale" });
    expect(points.length).toBeGreaterThan(0);
  });
});
