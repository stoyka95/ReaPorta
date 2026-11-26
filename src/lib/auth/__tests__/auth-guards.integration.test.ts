import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import { listings, users } from "@/db/schema";
import { assertOwnsListingForUser, AuthError } from "../session";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

describe("RBAC & IDOR assertOwnsListingForUser integration", () => {
  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.BETTER_AUTH_SECRET ??= "test-secret-reaporta-32-characters-minimum";
    process.env.CRON_SECRET ??= "test-cron-secret-reaporta-16";
  });

  afterAll(async () => {
    await closePool();
  });

  it("allows owner and admin, rejects another agent with 403 IDOR, and returns 404 for unknown listing", async () => {
    const db = getDb();
    const agentRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.role, "agent"))
      .limit(2);

    expect(agentRows.length).toBeGreaterThanOrEqual(2);
    const [agentA, agentB] = agentRows;

    const [listingOfA] = await db
      .select({ id: listings.id, agentId: listings.agentId })
      .from(listings)
      .where(eq(listings.agentId, agentA!.id))
      .limit(1);

    expect(listingOfA).toBeDefined();

    // Vlastník projde
    const owned = await assertOwnsListingForUser({ id: agentA!.id, role: "agent" }, listingOfA!.id);
    expect(owned.id).toBe(listingOfA!.id);

    // Cizí makléř dostane 403 (IDOR)
    await expect(
      assertOwnsListingForUser({ id: agentB!.id, role: "agent" }, listingOfA!.id),
    ).rejects.toMatchObject({ status: 403 } satisfies Partial<AuthError>);

    // Admin smí spravovat cizí inzerát
    const asAdmin = await assertOwnsListingForUser(
      { id: "00000000-0000-0000-0000-000000000001", role: "admin" },
      listingOfA!.id,
    );
    expect(asAdmin.id).toBe(listingOfA!.id);

    // Neexistující inzerát -> 404
    await expect(
      assertOwnsListingForUser(
        { id: agentA!.id, role: "agent" },
        "00000000-0000-0000-0000-000000000999",
      ),
    ).rejects.toMatchObject({ status: 404 } satisfies Partial<AuthError>);
  });
});
