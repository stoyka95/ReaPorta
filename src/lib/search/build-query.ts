import { and, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { listings, locations } from "@/db/schema";
import { type SearchFilters, type SortOption } from "./schema";

export function buildListingWhere(
  filters: SearchFilters,
  options?: { includeStatusFilter?: boolean; publishedAfter?: Date },
): SQL {
  const conditions: SQL[] = [];

  if (options?.includeStatusFilter !== false) {
    conditions.push(eq(listings.status, "active"));
  }

  if (filters.offerType) {
    conditions.push(eq(listings.offerType, filters.offerType));
  }

  if (filters.category) {
    conditions.push(eq(listings.category, filters.category));
  }

  if (filters.locations.length > 0) {
    const locConditions: SQL[] = [];
    for (const rawSlug of filters.locations) {
      const clean = rawSlug.replace(/^\/+|\/+$/g, "");
      if (!clean) continue;
      if (clean.includes("/")) {
        // Hierarchical full_slug match (exact node or any descendant)
        locConditions.push(
          sql`${listings.locationId} IN (
            SELECT ${locations.id} FROM ${locations}
            WHERE ${locations.fullSlug} = ${clean}
               OR ${locations.fullSlug} LIKE ${`${clean}/%`}
          )`,
        );
      } else {
        // Short slug match (e.g. "praha", "brno", "plzen") -> resolve matching nodes & descendants
        locConditions.push(
          sql`${listings.locationId} IN (
            SELECT child.id FROM ${locations} parent
            JOIN ${locations} child
              ON child.id = parent.id OR child.full_slug LIKE parent.full_slug || '/%'
            WHERE parent.slug = ${clean}
          )`,
        );
      }
    }
    if (locConditions.length === 1) {
      conditions.push(locConditions[0]!);
    } else if (locConditions.length > 1) {
      const combined = or(...locConditions);
      if (combined) conditions.push(combined);
    }
  }

  if (filters.priceMin !== undefined) {
    conditions.push(gte(listings.price, String(filters.priceMin)));
  }

  if (filters.priceMax !== undefined) {
    conditions.push(lte(listings.price, String(filters.priceMax)));
  }

  if (filters.usableAreaMin !== undefined) {
    conditions.push(gte(listings.usableArea, String(filters.usableAreaMin)));
  }

  if (filters.usableAreaMax !== undefined) {
    conditions.push(lte(listings.usableArea, String(filters.usableAreaMax)));
  }

  if (filters.landAreaMin !== undefined) {
    conditions.push(gte(listings.landArea, String(filters.landAreaMin)));
  }

  if (filters.landAreaMax !== undefined) {
    conditions.push(lte(listings.landArea, String(filters.landAreaMax)));
  }

  if (filters.dispositions.length > 0) {
    conditions.push(inArray(listings.disposition, filters.dispositions));
  }

  if (filters.conditions.length > 0) {
    conditions.push(inArray(listings.condition, filters.conditions));
  }

  if (filters.buildingTypes.length > 0) {
    conditions.push(inArray(listings.buildingType, filters.buildingTypes));
  }

  if (filters.ownerships.length > 0) {
    conditions.push(inArray(listings.ownership, filters.ownerships));
  }

  if (filters.floorMin !== undefined) {
    conditions.push(gte(listings.floor, filters.floorMin));
  }

  if (filters.floorMax !== undefined) {
    conditions.push(lte(listings.floor, filters.floorMax));
  }

  if (filters.energyClasses.length > 0) {
    conditions.push(inArray(listings.energyClass, filters.energyClasses));
  }

  if (filters.amenities.length > 0) {
    const amenityList = sql.join(
      filters.amenities.map((a) => sql`${a}`),
      sql`, `,
    );
    conditions.push(sql`${listings.amenities} @> ARRAY[${amenityList}]::text[]`);
  }

  if (filters.furnished) {
    conditions.push(eq(listings.furnished, filters.furnished));
  }

  if (filters.availableFrom) {
    conditions.push(lte(listings.availableFrom, filters.availableFrom));
  }

  if (filters.maxAgeDays !== undefined) {
    const since = new Date(Date.now() - filters.maxAgeDays * 86_400_000);
    conditions.push(gte(listings.publishedAt, since));
  }

  if (options?.publishedAfter) {
    conditions.push(sql`${listings.publishedAt} > ${options.publishedAfter}`);
  }

  if (filters.q && filters.q.length > 0) {
    const q = filters.q;
    conditions.push(
      sql`(
        ${listings.searchText} @@ websearch_to_tsquery('simple', public.immutable_unaccent(${q}))
        OR public.immutable_unaccent(lower(${listings.city})) % public.immutable_unaccent(lower(${q}))
        OR public.immutable_unaccent(lower(coalesce(${listings.district}, ''))) % public.immutable_unaccent(lower(${q}))
      )`,
    );
  }

  if (filters.bbox) {
    const { west, south, east, north } = filters.bbox;
    conditions.push(
      and(
        gte(listings.lat, south),
        lte(listings.lat, north),
        gte(listings.lng, west),
        lte(listings.lng, east),
      )!,
    );
  }

  return conditions.length > 0 ? and(...conditions)! : sql`TRUE`;
}

export function buildListingOrderBy(sort: SortOption): SQL[] {
  switch (sort) {
    case "price_asc":
      return [sql`${listings.price} ASC NULLS LAST`, desc(listings.publishedAt)];
    case "price_desc":
      return [sql`${listings.price} DESC NULLS LAST`, desc(listings.publishedAt)];
    case "area_desc":
      return [sql`${listings.usableArea} DESC NULLS LAST`, desc(listings.publishedAt)];
    case "price_per_m2_asc":
      return [sql`${listings.pricePerM2} ASC NULLS LAST`, desc(listings.publishedAt)];
    case "newest":
    default:
      return [sql`${listings.publishedAt} DESC NULLS LAST`, desc(listings.createdAt)];
  }
}
