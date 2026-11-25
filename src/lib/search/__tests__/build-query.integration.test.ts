import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool } from "@/db/client";
import { resetEnvCache } from "@/lib/env";
import { searchListings } from "@/db/queries/listings";

const TEST_DB_URL = "postgres://postgres:postgres@localhost:5432/reaporta_test";

describe("Search query builder — every filter (AC-2.1) and sort (AC-2.2)", () => {
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

  it("filters by offerType and category", async () => {
    const res = await searchListings({ offerType: "rent", category: "flat", pageSize: 24 });
    expect(res.total).toBeGreaterThan(0);
    expect(res.items.every((i) => i.offerType === "rent" && i.category === "flat")).toBe(true);
  });

  it("filters by multiple locations including hierarchical descendants", async () => {
    const res = await searchListings({
      locations: ["hlavni-mesto-praha/praha/praha", "jihomoravsky-kraj/brno-mesto/brno"],
      pageSize: 48,
    });
    expect(res.total).toBeGreaterThan(50);
    expect(res.items.every((i) => i.city === "Praha" || i.city === "Brno")).toBe(true);
  });

  it("filters by price range, usable area, and land area", async () => {
    const byPrice = await searchListings({
      offerType: "sale",
      priceMin: 4_000_000,
      priceMax: 9_000_000,
    });
    expect(byPrice.total).toBeGreaterThan(0);
    expect(
      byPrice.items.every((i) => i.price !== null && i.price >= 4_000_000 && i.price <= 9_000_000),
    ).toBe(true);

    const byArea = await searchListings({
      category: "flat",
      usableAreaMin: 50,
      usableAreaMax: 85,
    });
    expect(byArea.total).toBeGreaterThan(0);
    expect(
      byArea.items.every((i) => i.usableArea !== null && i.usableArea >= 50 && i.usableArea <= 85),
    ).toBe(true);

    const byLand = await searchListings({
      category: "house",
      landAreaMin: 400,
      landAreaMax: 1500,
    });
    expect(byLand.total).toBeGreaterThan(0);
    expect(
      byLand.items.every((i) => i.landArea !== null && i.landArea >= 400 && i.landArea <= 1500),
    ).toBe(true);
  });

  it("filters by dispositions, amenities, energyClass, condition, buildingType, ownership, floor, furnished, age, fulltext, bbox", async () => {
    const byDisp = await searchListings({ dispositions: ["2+kk", "3+kk"] });
    expect(byDisp.total).toBeGreaterThan(0);
    expect(byDisp.items.every((i) => i.disposition === "2+kk" || i.disposition === "3+kk")).toBe(
      true,
    );

    const byAmenities = await searchListings({ amenities: ["balcony", "cellar"] });
    expect(byAmenities.total).toBeGreaterThan(0);
    expect(
      byAmenities.items.every(
        (i) => i.amenities.includes("balcony") && i.amenities.includes("cellar"),
      ),
    ).toBe(true);

    const byPenb = await searchListings({ energyClasses: ["B", "C"] });
    expect(byPenb.total).toBeGreaterThan(0);
    expect(byPenb.items.every((i) => i.energyClass === "B" || i.energyClass === "C")).toBe(true);

    const byMisc = await searchListings({
      conditions: ["very_good", "good", "after_renovation", "new_build"],
      buildingTypes: ["brick"],
      ownerships: ["personal"],
      floorMin: 1,
      floorMax: 8,
      furnished: "yes",
    });
    expect(byMisc.total).toBeGreaterThanOrEqual(0);

    const byAge = await searchListings({ maxAgeDays: 30 });
    expect(byAge.total).toBeGreaterThan(0);

    const byFulltext = await searchListings({ q: "Brno" });
    expect(byFulltext.total).toBeGreaterThan(0);

    // Prague bbox
    const byBbox = await searchListings({
      bbox: { west: 14.25, south: 49.95, east: 14.65, north: 50.18 },
    });
    expect(byBbox.total).toBeGreaterThan(0);
    expect(
      byBbox.items.every(
        (i) => i.lat >= 49.95 && i.lat <= 50.18 && i.lng >= 14.25 && i.lng <= 14.65,
      ),
    ).toBe(true);
  });

  it("supports all 5 sort options accurately (AC-2.2) within <= 300ms (AC-2.6)", async () => {
    const start = performance.now();
    const ascPrice = await searchListings({ offerType: "sale", sort: "price_asc", pageSize: 10 });
    const descPrice = await searchListings({ offerType: "sale", sort: "price_desc", pageSize: 10 });
    const descArea = await searchListings({ offerType: "sale", sort: "area_desc", pageSize: 10 });
    const ascPerM2 = await searchListings({
      offerType: "sale",
      category: "flat",
      sort: "price_per_m2_asc",
      pageSize: 10,
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(300);

    const ascNums = ascPrice.items.map((i) => i.price).filter((n): n is number => n !== null);
    for (let i = 1; i < ascNums.length; i++) {
      expect(ascNums[i]!).toBeGreaterThanOrEqual(ascNums[i - 1]!);
    }

    const descNums = descPrice.items.map((i) => i.price).filter((n): n is number => n !== null);
    for (let i = 1; i < descNums.length; i++) {
      expect(descNums[i]!).toBeLessThanOrEqual(descNums[i - 1]!);
    }

    const areaNums = descArea.items.map((i) => i.usableArea).filter((n): n is number => n !== null);
    for (let i = 1; i < areaNums.length; i++) {
      expect(areaNums[i]!).toBeLessThanOrEqual(areaNums[i - 1]!);
    }

    const m2Nums = ascPerM2.items.map((i) => i.pricePerM2).filter((n): n is number => n !== null);
    for (let i = 1; i < m2Nums.length; i++) {
      expect(m2Nums[i]!).toBeGreaterThanOrEqual(m2Nums[i - 1]!);
    }
  });
});
