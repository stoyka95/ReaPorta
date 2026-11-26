import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import { listingPriceHistory, listings, users } from "@/db/schema";
import {
  createDraftListing,
  deleteAgentListingHard,
  duplicateAgentListing,
  transitionAgentListingStatus,
  updateAgentListing,
} from "@/db/queries/dashboard";
import { assertOwnsListingForUser } from "@/lib/auth/session";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

describe("Dashboard CRUD, price history, lifecycle & IDOR integration (AC-6.6..6.8)", () => {
  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.BETTER_AUTH_SECRET ??= "test-secret-reaporta-32-characters-minimum";
    process.env.CRON_SECRET ??= "test-cron-secret-reaporta-16";
  });

  afterAll(async () => {
    await closePool();
  });

  it("creates draft, submits to pending, logs price history on active price drop, duplicates, transitions lifecycle, and blocks other agents (IDOR)", async () => {
    const db = getDb();
    const agents = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "agent"))
      .limit(2);
    expect(agents.length).toBeGreaterThanOrEqual(2);
    const [agentA, agentB] = agents;

    const created = await createDraftListing(agentA!.id, {
      offerType: "sale",
      category: "flat",
      disposition: "2+kk",
      city: "Praha",
      title: "Testovací byt 2+kk pro integraci",
      description:
        "Kompletní popis testovacího bytu s balkonem a sklepem pro ověření životního cyklu.",
      price: 6500000,
      priceUnit: "total",
    });

    let duplicateId: string | null = null;
    try {
      // IDOR: agentB nesmí přistupovat k inzerátu agentA
      await expect(
        assertOwnsListingForUser({ id: agentB!.id, role: "agent" }, created.id),
      ).rejects.toMatchObject({ status: 403 });

      // Odeslat do moderace (draft -> pending)
      const submitted = await updateAgentListing(created.id, { submitForReview: true });
      expect(submitted.status).toBe("pending");

      // Simulovat schválení adminem -> active, pak snížit cenu -> záznam v listing_price_history
      await db
        .update(listings)
        .set({ status: "active", publishedAt: new Date() })
        .where(eq(listings.id, created.id));

      await updateAgentListing(created.id, { price: 5900000 });
      const hist = await db
        .select()
        .from(listingPriceHistory)
        .where(eq(listingPriceHistory.listingId, created.id));
      expect(hist.length).toBe(1);
      expect(Number(hist[0]!.price)).toBe(6500000);

      // Pozastavit -> obnovit -> duplikovat
      expect((await transitionAgentListingStatus(created.id, "pause")).status).toBe("paused");
      expect((await transitionAgentListingStatus(created.id, "resume")).status).toBe("active");

      const dup = await duplicateAgentListing(agentA!.id, created.id);
      duplicateId = dup.id;
      expect(dup.id).not.toBe(created.id);
    } finally {
      if (duplicateId) await deleteAgentListingHard(duplicateId);
      await deleteAgentListingHard(created.id);
    }
  });
});
