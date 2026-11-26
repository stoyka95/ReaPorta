import { z } from "zod";

export const inquirySchema = z.object({
  listingId: z.string().uuid("Neplatný identifikátor nabídky."),
  name: z
    .string()
    .trim()
    .min(2, "Zadejte prosím své jméno (alespoň 2 znaky).")
    .max(100, "Jméno může mít nejvýše 100 znaků."),
  email: z.string().trim().email("Zadejte prosím platný e-mail."),
  phone: z
    .string()
    .trim()
    .max(30, "Telefonní číslo je příliš dlouhé.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Napište prosím zprávu alespoň o 10 znacích.")
    .max(2000, "Zpráva může mít nejvýše 2 000 znaků."),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Pro odeslání poptávky je potřeba udělit souhlas." }),
  }),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const REPORT_REASONS = ["fraud", "duplicate", "wrong_info", "sold", "other"] as const;

export const reportSchema = z.object({
  listingId: z.string().uuid("Neplatný identifikátor nabídky."),
  reason: z.enum(REPORT_REASONS, {
    errorMap: () => ({ message: "Vyberte prosím důvod nahlášení." }),
  }),
  details: z.string().trim().max(1000, "Popis může mít nejvýše 1 000 znaků.").optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;
