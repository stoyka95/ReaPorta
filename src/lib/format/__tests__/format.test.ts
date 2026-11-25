import { describe, expect, it } from "vitest";
import {
  formatArea,
  formatDate,
  formatFloor,
  formatListingCount,
  formatPrice,
  formatPricePerM2,
  formatShortPrice,
  nbsp,
} from "@/lib/format";

const NBSP = "\u00A0";

describe("Czech formatters", () => {
  it("formats prices with non-breaking spaces and units", () => {
    expect(formatPrice(5_990_000, "total")).toBe(`5${NBSP}990${NBSP}000${NBSP}Kč`);
    expect(formatPrice(25_000, "per_month")).toBe(`25${NBSP}000${NBSP}Kč/měsíc`);
    expect(formatPrice(null, "total", { priceOnRequest: true })).toBe("Cena na dotaz");
    expect(formatPricePerM2(76_790)).toBe(`76${NBSP}790${NBSP}Kč/m²`);
  });

  it("formats short map pin prices", () => {
    expect(formatShortPrice(5_990_000)).toBe(`5,99${NBSP}M`);
    expect(formatShortPrice(25_000)).toBe(`25${NBSP}tis.`);
    expect(formatShortPrice(null)).toBe("Dotaz");
  });

  it("formats areas, floors, and dates", () => {
    expect(formatArea(78)).toBe(`78${NBSP}m²`);
    expect(formatArea(78.5)).toBe(`78,5${NBSP}m²`);
    expect(formatFloor(2, 5)).toBe(`2.${NBSP}patro z${NBSP}5`);
    expect(formatFloor(0, 4)).toBe(`Přízemí z${NBSP}4`);
    expect(formatDate(new Date("2026-11-25T10:00:00Z"))).toBe(`25.${NBSP}11.${NBSP}2026`);
  });

  it("handles Czech plural rules accurately (0, 1, 2, 4, 5, 11, 21)", () => {
    expect(formatListingCount(0)).toBe(`0${NBSP}nabídek`);
    expect(formatListingCount(1)).toBe(`1${NBSP}nabídka`);
    expect(formatListingCount(2)).toBe(`2${NBSP}nabídky`);
    expect(formatListingCount(4)).toBe(`4${NBSP}nabídky`);
    expect(formatListingCount(5)).toBe(`5${NBSP}nabídek`);
    expect(formatListingCount(11)).toBe(`11${NBSP}nabídek`);
    expect(formatListingCount(21)).toBe(`21${NBSP}nabídek`);
  });

  it("binds Czech single-letter prepositions with non-breaking spaces", () => {
    expect(nbsp("Byt v Praze a s balkonem u parku")).toBe(
      `Byt v${NBSP}Praze a${NBSP}s${NBSP}balkonem u${NBSP}parku`,
    );
  });
});
