import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { locations } from "@/db/schema";

export interface LocationSuggestion {
  id: number;
  name: string;
  type: "kraj" | "okres" | "obec" | "cast";
  slug: string;
  fullSlug: string;
  lat: number;
  lng: number;
  population: number;
  listingCount: number;
  parentName: string | null;
}

export async function suggestLocations(query: string, limit = 8): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  const db = getDb();
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const pattern = `${q}%`;

  const result = await db.execute<{
    id: number;
    name: string;
    type: "kraj" | "okres" | "obec" | "cast";
    slug: string;
    full_slug: string;
    lat: number;
    lng: number;
    population: number;
    listing_count_cache: number;
    parent_name: string | null;
  }>(sql`
    SELECT
      l.id,
      l.name,
      l.type,
      l.slug,
      l.full_slug,
      l.lat,
      l.lng,
      l.population,
      l.listing_count_cache,
      p.name AS parent_name
    FROM locations l
    LEFT JOIN locations p ON p.id = l.parent_id
    WHERE
      public.immutable_unaccent(lower(l.name)) LIKE public.immutable_unaccent(lower(${pattern}))
      OR public.immutable_unaccent(lower(l.name)) % public.immutable_unaccent(lower(${q}))
      OR public.immutable_unaccent(lower(l.name)) LIKE '%' || public.immutable_unaccent(lower(${q})) || '%'
    ORDER BY
      (public.immutable_unaccent(lower(l.name)) = public.immutable_unaccent(lower(${q}))) DESC,
      (public.immutable_unaccent(lower(l.name)) LIKE public.immutable_unaccent(lower(${pattern}))) DESC,
      CASE l.type WHEN 'obec' THEN 0 WHEN 'cast' THEN 1 WHEN 'okres' THEN 2 ELSE 3 END ASC,
      similarity(public.immutable_unaccent(lower(l.name)), public.immutable_unaccent(lower(${q}))) DESC,
      l.population DESC
    LIMIT ${safeLimit}
  `);

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    slug: row.slug,
    fullSlug: row.full_slug,
    lat: row.lat,
    lng: row.lng,
    population: row.population,
    listingCount: row.listing_count_cache,
    parentName: row.parent_name,
  }));
}

export async function getLocationByFullSlug(fullSlug: string) {
  const db = getDb();
  const clean = fullSlug.replace(/^\/+|\/+$/g, "");
  const rows = await db.select().from(locations).where(eq(locations.fullSlug, clean)).limit(1);
  return rows[0] ?? null;
}

export async function getLocationByShortOrFullSlug(slugOrPath: string) {
  const db = getDb();
  const clean = slugOrPath.replace(/^\/+|\/+$/g, "");
  if (clean.includes("/")) {
    return getLocationByFullSlug(clean);
  }
  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.slug, clean))
    .orderBy(
      sql`CASE ${locations.type} WHEN 'obec' THEN 0 WHEN 'cast' THEN 1 WHEN 'okres' THEN 2 ELSE 3 END ASC`,
      desc(locations.population),
    )
    .limit(1);
  return rows[0] ?? null;
}

const POPULAR_CITY_SLUGS = [
  "praha",
  "brno",
  "ostrava",
  "plzen",
  "olomouc",
  "liberec",
  "ceske-budejovice",
  "hradec-kralove",
];

export async function getPopularCities() {
  const db = getDb();
  const rows = await db
    .select({
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      fullSlug: locations.fullSlug,
      lat: locations.lat,
      lng: locations.lng,
      population: locations.population,
      listingCount: locations.listingCountCache,
    })
    .from(locations)
    .where(sql`${locations.type} = 'obec' AND ${inArray(locations.slug, POPULAR_CITY_SLUGS)}`)
    .orderBy(desc(locations.listingCountCache), desc(locations.population))
    .limit(8);
  return rows;
}
