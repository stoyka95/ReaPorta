import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agencies, agentProfiles, listings, locations } from "@/db/schema";

export interface SitemapData {
  activeListings: Array<{ slug: string; updatedAt: Date }>;
  agents: Array<{ slug: string }>;
  agencies: Array<{ slug: string }>;
  topCities: Array<{ slug: string }>;
}

/**
 * Vrátí výhradně veřejná a aktivní data pro sitemap.xml (AC-9.3, QA E6).
 * Koncepty, čekající, zamítnuté, pozastavené, prodané a expirované inzeráty jsou vždy vyloučeny.
 */
export async function getSitemapData(limit = 10_000, offset = 0): Promise<SitemapData> {
  const db = getDb();

  const [activeListings, agents, agencyRows, cityRows] = await Promise.all([
    db
      .select({
        slug: listings.slug,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ slug: agentProfiles.slug }).from(agentProfiles),
    db.select({ slug: agencies.slug }).from(agencies),
    db
      .select({ slug: locations.slug })
      .from(locations)
      .where(eq(locations.type, "obec"))
      .orderBy(desc(locations.population))
      .limit(20),
  ]);

  return {
    activeListings,
    agents,
    agencies: agencyRows,
    topCities: cityRows,
  };
}
