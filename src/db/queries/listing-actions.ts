import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentProfiles, inquiries, listingDailyStats, listings, reports, users } from "@/db/schema";

export async function getListingContactInfo(listingId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      title: listings.title,
      agentId: listings.agentId,
      status: listings.status,
      phonePublic: agentProfiles.phonePublic,
      emailPublic: agentProfiles.emailPublic,
      agentEmail: users.email,
    })
    .from(listings)
    .innerJoin(users, eq(listings.agentId, users.id))
    .leftJoin(agentProfiles, eq(listings.agentId, agentProfiles.userId))
    .where(eq(listings.id, listingId))
    .limit(1);

  return rows[0] ?? null;
}

export async function recordPhoneReveal(listingId: string): Promise<void> {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(listingDailyStats)
    .values({
      listingId,
      day: today,
      views: 0,
      phoneReveals: 1,
    })
    .onConflictDoUpdate({
      target: [listingDailyStats.listingId, listingDailyStats.day],
      set: {
        phoneReveals: sql`${listingDailyStats.phoneReveals} + 1`,
      },
    });
}

export async function createInquiryRecord(input: {
  listingId: string;
  agentId: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  ipHash: string;
}): Promise<{ id: string }> {
  const db = getDb();
  const [row] = await db
    .insert(inquiries)
    .values({
      listingId: input.listingId,
      agentId: input.agentId,
      userId: input.userId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      message: input.message,
      status: "new",
      ipHash: input.ipHash,
    })
    .returning({ id: inquiries.id });

  return { id: row!.id };
}

export async function createReportRecord(input: {
  listingId: string;
  reporterUserId?: string | null;
  reason: "fraud" | "duplicate" | "wrong_info" | "sold" | "other";
  details?: string | null;
}): Promise<{ id: string }> {
  const db = getDb();
  const [row] = await db
    .insert(reports)
    .values({
      listingId: input.listingId,
      reporterUserId: input.reporterUserId ?? null,
      reason: input.reason,
      details: input.details ?? null,
      status: "open",
    })
    .returning({ id: reports.id });

  return { id: row!.id };
}
