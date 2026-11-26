import { z } from "zod";
import {
  AMENITIES,
  BUILDING_TYPES,
  CATEGORIES,
  CONDITIONS,
  DISPOSITIONS,
  ENERGY_CLASSES,
  FURNISHED_OPTIONS,
  OFFER_TYPES,
  OWNERSHIPS,
} from "@/lib/search/schema";

const optionalPositiveNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

const optionalInt = z.union([z.number(), z.string(), z.null(), z.undefined()]).transform((v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : null;
});

export const draftPatchSchema = z.object({
  offerType: z.enum(OFFER_TYPES).optional(),
  category: z.enum(CATEGORIES).optional(),
  subtype: z.string().trim().max(60).nullable().optional(),
  disposition: z.enum(DISPOSITIONS).nullable().optional(),

  locationId: z.number().int().positive().optional(),
  city: z.string().trim().min(1).max(120).optional(),
  district: z.string().trim().max(120).nullable().optional(),
  street: z.string().trim().max(120).nullable().optional(),
  houseNumber: z.string().trim().max(24).nullable().optional(),
  zip: z.string().trim().max(12).nullable().optional(),
  lat: z.number().min(48).max(51.5).optional(),
  lng: z.number().min(11.8).max(19.2).optional(),
  showExactLocation: z.boolean().optional(),

  usableArea: optionalPositiveNumber.optional(),
  landArea: optionalPositiveNumber.optional(),
  builtArea: optionalPositiveNumber.optional(),
  floor: optionalInt.optional(),
  floorsTotal: optionalInt.optional(),
  yearBuilt: optionalInt.optional(),
  lastRenovation: optionalInt.optional(),
  buildingType: z.enum(BUILDING_TYPES).nullable().optional(),
  condition: z.enum(CONDITIONS).nullable().optional(),
  ownership: z.enum(OWNERSHIPS).nullable().optional(),
  energyClass: z.enum(ENERGY_CLASSES).nullable().optional(),
  furnished: z.enum(FURNISHED_OPTIONS).nullable().optional(),
  amenities: z.array(z.enum(AMENITIES)).max(12).optional(),
  availableFrom: z.string().trim().max(20).nullable().optional(),

  title: z.string().trim().max(140).optional(),
  description: z.string().trim().max(8000).optional(),
  price: optionalPositiveNumber.optional(),
  priceUnit: z.enum(["total", "per_month", "per_m2_month"]).optional(),
  priceNegotiable: z.boolean().optional(),
  priceOnRequest: z.boolean().optional(),
  feesMonthly: optionalPositiveNumber.optional(),
  deposit: optionalPositiveNumber.optional(),

  submitForReview: z.boolean().optional(),
});

export type DraftPatchInput = z.infer<typeof draftPatchSchema>;

export const submitListingValidationSchema = z
  .object({
    offerType: z.enum(OFFER_TYPES),
    category: z.enum(CATEGORIES),
    city: z.string().trim().min(1, "Vyberte prosím lokalitu."),
    title: z
      .string()
      .trim()
      .min(8, "Nadpis musí mít alespoň 8 znaků.")
      .max(140, "Nadpis může mít nejvýše 140 znaků."),
    description: z
      .string()
      .trim()
      .min(30, "Popis nemovitosti musí mít alespoň 30 znaků.")
      .max(8000, "Popis může mít nejvýše 8 000 znaků."),
    price: z.number().positive("Zadejte prosím platnou cenu.").nullable(),
    priceOnRequest: z.boolean(),
  })
  .refine((v) => v.priceOnRequest || (v.price !== null && v.price > 0), {
    path: ["price"],
    message: "Zadejte cenu, nebo zaškrtněte Cena na dotaz.",
  });

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Vyberte alespoň jeden inzerát.").max(100),
  action: z.enum(["pause", "resume", "delete"]),
});

export const statusActionSchema = z.object({
  action: z.enum(["pause", "resume", "sold", "extend"]),
});

export const reorderImagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1).max(40),
  coverId: z.string().uuid().optional(),
});
