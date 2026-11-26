import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import { emailOutbox, listings, locations, savedSearches, users } from "@/db/schema";
import { runSavedSearchAlerts } from "../alerts";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

describe("runSavedSearchAlerts idempotency (AC-5.5 / QA B7)", () => {
  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.BETTER_AUTH_SECRET ??= "test-secret-reaporta-32-characters-minimum";
    process.env.CRON_SECRET ??= "test-cron-secret-reaporta-16";
  });

  afterAll(async () => {
    await closePool();
  });

  it("queues exactly 1 summary email for a newly published matching listing and 0 on second immediate run", async () => {
    const db = getDb();

    const [regularUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, "uzivatel@reaporta.test"))
      .limit(1);
    const [agentUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "makler@reaporta.test"))
      .limit(1);
    const [loc] = await db.select({ id: locations.id }).from(locations).limit(1);

    expect(regularUser).toBeDefined();
    expect(agentUser).toBeDefined();
    expect(loc).toBeDefined();

    const uniqueTag = `alerts-test-${Date.now()}`;
    const past = new Date(Date.now() - 10 * 60 * 1000);
    const justNow = new Date(Date.now() - 1000);

    const [createdSearch] = await db
      .insert(savedSearches)
      .values({
        userId: regularUser!.id,
        name: `Test hlídací pes ${uniqueTag}`,
        params: { offerType: "sale", category: "flat", q: uniqueTag },
        frequency: "instant",
        lastNotifiedAt: past,
      })
      .returning({ id: savedSearches.id });

    const [createdListing] = await db
      .insert(listings)
      .values({
        slug: `test-alert-${uniqueTag}`,
        agentId: agentUser!.id,
        status: "active",
        offerType: "sale",
        category: "flat",
        title: `Prodej bytu 2+kk ${uniqueTag}`,
        description: `Nový testovací byt pro ověření hlídacího psa ${uniqueTag}.`,
        price: "5200000",
        priceUnit: "total",
        locationId: loc!.id,
        city: "Brno",
        lat: 49.1951,
        lng: 16.6068,
        publishedAt: justNow,
      })
      .returning({ id: listings.id });

    try {
      const firstRun = await runSavedSearchAlerts();
      expect(firstRun.notified).toBeGreaterThanOrEqual(1);

      const outboxAfterFirst = await db
        .select({ id: emailOutbox.id, subject: emailOutbox.subject })
        .from(emailOutbox)
        .where(eq(emailOutbox.toEmail, regularUser!.email));
      const matchingFirst = outboxAfterFirst.filter((m) => m.subject.includes(uniqueTag));
      expect(matchingFirst.length).toBe(1);

      // Druhé okamžité spuštění nesmí poslat duplicitní e-mail
      const secondRun = await runSavedSearchAlerts();
      expect(secondRun.notified).toBe(0);

      const outboxAfterSecond = await db
        .select({ id: emailOutbox.id, subject: emailOutbox.subject })
        .from(emailOutbox)
        .where(eq(emailOutbox.toEmail, regularUser!.email));
      const matchingSecond = outboxAfterSecond.filter((m) => m.subject.includes(uniqueTag));
      expect(matchingSecond.length).toBe(1);
    } finally {
      await db.delete(listings).where(eq(listings.id, createdListing!.id));
      await db.delete(savedSearches).where(eq(savedSearches.id, createdSearch!.id));
      await db.delete(emailOutbox).where(eq(emailOutbox.toEmail, regularUser!.email));
    }
  });
});
