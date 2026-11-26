import "dotenv/config";
import { and, eq, lt } from "drizzle-orm";
import { closePool, getDb } from "../src/db/client";
import { listings } from "../src/db/schema";

async function main(): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expired = await db
    .update(listings)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(listings.status, "active"), lt(listings.expiresAt, now)))
    .returning({ id: listings.id });

  console.log(`job:expire hotovo — označeno jako expirované: ${expired.length}`);
  await closePool();
}

main().catch(async (err) => {
  console.error("Chyba při běhu job:expire:", err);
  await closePool();
  process.exit(1);
});
