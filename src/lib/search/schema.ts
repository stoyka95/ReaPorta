import { z } from "zod";

export const OFFER_TYPES = ["sale", "rent"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const CATEGORIES = ["flat", "house", "land", "commercial", "other"] as const;
export type ListingCategory = (typeof CATEGORIES)[number];

export const DISPOSITIONS = [
  "1+kk",
  "1+1",
  "2+kk",
  "2+1",
  "3+kk",
  "3+1",
  "4+kk",
  "4+1",
  "5+kk",
  "5+1",
  "6_and_more",
  "atypical",
] as const;

export const BUILDING_TYPES = [
  "brick",
  "panel",
  "wood",
  "stone",
  "skeleton",
  "mixed",
  "other",
] as const;

export const CONDITIONS = [
  "new_build",
  "very_good",
  "good",
  "after_renovation",
  "before_renovation",
  "under_construction",
  "project",
  "demolition",
] as const;

export const OWNERSHIPS = ["personal", "cooperative", "state", "other"] as const;

export const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export const FURNISHED_OPTIONS = ["yes", "partly", "no"] as const;

export const AMENITIES = [
  "balcony",
  "terrace",
  "loggia",
  "cellar",
  "elevator",
  "garage",
  "parking",
  "garden",
  "pool",
  "barrier_free",
  "ac",
  "fireplace",
] as const;

export const SORT_OPTIONS = [
  "newest",
  "price_asc",
  "price_desc",
  "area_desc",
  "price_per_m2_asc",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const bboxSchema = z
  .object({
    west: z.number().min(-180).max(180),
    south: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
  })
  .refine((b) => b.south <= b.north && b.west <= b.east, {
    message: "Neplatné hranice mapy (bbox).",
  });

export type Bbox = z.infer<typeof bboxSchema>;

export function parseBboxString(raw: string | null | undefined): Bbox | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const parsed = bboxSchema.safeParse({
    west: parts[0],
    south: parts[1],
    east: parts[2],
    north: parts[3],
  });
  return parsed.success ? parsed.data : undefined;
}

export const searchFiltersSchema = z.object({
  offerType: z.enum(OFFER_TYPES).optional(),
  category: z.enum(CATEGORIES).optional(),
  locations: z.array(z.string().min(1).max(200)).max(10).default([]),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  usableAreaMin: z.coerce.number().nonnegative().optional(),
  usableAreaMax: z.coerce.number().nonnegative().optional(),
  landAreaMin: z.coerce.number().nonnegative().optional(),
  landAreaMax: z.coerce.number().nonnegative().optional(),
  dispositions: z.array(z.enum(DISPOSITIONS)).default([]),
  conditions: z.array(z.enum(CONDITIONS)).default([]),
  buildingTypes: z.array(z.enum(BUILDING_TYPES)).default([]),
  ownerships: z.array(z.enum(OWNERSHIPS)).default([]),
  floorMin: z.coerce.number().int().min(-2).max(100).optional(),
  floorMax: z.coerce.number().int().min(-2).max(100).optional(),
  energyClasses: z.array(z.enum(ENERGY_CLASSES)).default([]),
  amenities: z.array(z.enum(AMENITIES)).default([]),
  furnished: z.enum(FURNISHED_OPTIONS).optional(),
  availableFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  maxAgeDays: z.coerce.number().int().positive().max(365).optional(),
  q: z.string().trim().max(120).optional(),
  bbox: bboxSchema.optional(),
  sort: z.enum(SORT_OPTIONS).default("newest"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchFiltersInput = z.input<typeof searchFiltersSchema>;

export const CATEGORY_URL_TO_ENUM: Record<string, ListingCategory | undefined> = {
  byty: "flat",
  domy: "house",
  pozemky: "land",
  komercni: "commercial",
  ostatni: "other",
  vse: undefined,
};

export const CATEGORY_ENUM_TO_URL: Record<ListingCategory, string> = {
  flat: "byty",
  house: "domy",
  land: "pozemky",
  commercial: "komercni",
  other: "ostatni",
};

export const OFFER_URL_TO_ENUM: Record<string, OfferType | undefined> = {
  prodej: "sale",
  pronajem: "rent",
};

export const OFFER_ENUM_TO_URL: Record<OfferType, string> = {
  sale: "prodej",
  rent: "pronajem",
};
