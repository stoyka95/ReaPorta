import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, ne, and } from "drizzle-orm";
import { closePool, getDb } from "@/db/client";
import { inquiries, listings, users } from "@/db/schema";
import {
  getPublicAgencyBySlug,
  getPublicAgentBySlug,
  updateAgentInquiryStatus,
} from "@/db/queries/profiles";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

describe("Stage 9 — Profiles active-only filter & Inquiry IDOR integration (AC-7.1..7.3)", () => {
  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.BETTER_AUTH_SECRET ??= "test-secret-reaporta-32-characters-minimum";
    process.env.CRON_SECRET ??= "test-cron-secret-reaporta-16";
  });

  afterAll(async () => {
    await closePool();
  });

  it("public agent & agency profiles expose ONLY active listings (QA C11)", async () => {
    const db = getDb();
    const agent = await getPublicAgentBySlug("tereza-novotna");
    expect(agent).not.toBeNull();
    expect(agent!.listings.length).toBeGreaterThan(0);

    // Ověřit, že žádný neaktivní inzerát makléřky se nedostal na veřejný profil
    const inactiveRows = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(eq(listings.agentId, agent!.userId), ne(listings.status, "active")));
    const publicIds = new Set(agent!.listings.map((l) => l.id));
    for (const inactive of inactiveRows) {
      expect(publicIds.has(inactive.id)).toBe(false);
    }

    const agency = await getPublicAgencyBySlug("bohemia-home-reality");
    expect(agency).not.toBeNull();
    expect(agency!.agents.length).toBeGreaterThan(0);
    expect(agency!.listings.length).toBeGreaterThan(0);

    const inactiveAgencyRows = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(eq(listings.agencyId, agency!.id), ne(listings.status, "active")));
    const agencyPublicIds = new Set(agency!.listings.map((l) => l.id));
    for (const inactive of inactiveAgencyRows) {
      expect(agencyPublicIds.has(inactive.id)).toBe(false);
    }
  });

  it("blocks another agent from modifying someone else's inquiry (IDOR)", async () => {
    const db = getDb();
    const agents = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "agent"))
      .limit(2);
    const [agentA, agentB] = agents;

    const [inq] = await db
      .select({ id: inquiries.id, status: inquiries.status })
      .from(inquiries)
      .where(eq(inquiries.agentId, agentA!.id))
      .limit(1);

    expect(inq).toBeDefined();

    // Cizí makléř nemůže změnit stav poptávky
    const forbidden = await updateAgentInquiryStatus(agentB!.id, inq!.id, "archived", false);
    expect(forbidden).toBe(false);

    // Vlastník může
    const allowed = await updateAgentInquiryStatus(agentA!.id, inq!.id, inq!.status, false);
    expect(allowed).toBe(true);
  });
});
