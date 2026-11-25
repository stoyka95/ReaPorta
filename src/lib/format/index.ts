const NBSP = "\u00A0";

const csIntegerFormatter = new Intl.NumberFormat("cs-CZ", {
  maximumFractionDigits: 0,
});

const csDecimalFormatter = new Intl.NumberFormat("cs-CZ", {
  maximumFractionDigits: 2,
});

const csPluralRules = new Intl.PluralRules("cs");

function normalizeSpacesToNbsp(value: string): string {
  return value.replace(/\s/g, NBSP);
}

export function formatNumber(value: number): string {
  return normalizeSpacesToNbsp(csIntegerFormatter.format(Math.round(value)));
}

export function formatPrice(
  price: number | null | undefined,
  unit: "total" | "per_month" | "per_m2_month" = "total",
  options?: { priceOnRequest?: boolean },
): string {
  if (options?.priceOnRequest || price === null || price === undefined || !Number.isFinite(price)) {
    return "Cena na dotaz";
  }
  const num = formatNumber(price);
  if (unit === "per_month") {
    return `${num}${NBSP}Kč/měsíc`;
  }
  if (unit === "per_m2_month") {
    return `${num}${NBSP}Kč/m²/měsíc`;
  }
  return `${num}${NBSP}Kč`;
}

export function formatPricePerM2(pricePerM2: number | null | undefined): string | null {
  if (pricePerM2 === null || pricePerM2 === undefined || !Number.isFinite(pricePerM2)) {
    return null;
  }
  return `${formatNumber(pricePerM2)}${NBSP}Kč/m²`;
}

export function formatShortPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || !Number.isFinite(price)) {
    return "Dotaz";
  }
  if (price >= 1_000_000) {
    const millions = Math.round((price / 1_000_000) * 100) / 100;
    return `${csDecimalFormatter.format(millions)}${NBSP}M`;
  }
  if (price >= 1_000) {
    const thousands = Math.round(price / 1_000);
    return `${formatNumber(thousands)}${NBSP}tis.`;
  }
  return `${formatNumber(price)}${NBSP}Kč`;
}

export function formatArea(area: number | null | undefined): string | null {
  if (area === null || area === undefined || !Number.isFinite(area)) {
    return null;
  }
  const rounded = Math.round(area * 10) / 10;
  const formatted = Number.isInteger(rounded)
    ? formatNumber(rounded)
    : normalizeSpacesToNbsp(csDecimalFormatter.format(rounded));
  return `${formatted}${NBSP}m²`;
}

export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}.${NBSP}${date.getMonth() + 1}.${NBSP}${date.getFullYear()}`;
}

export function formatRelativeDays(
  input: Date | string | null | undefined,
  now: Date = new Date(),
): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
  if (diffDays === 0) return "dnes";
  if (diffDays === 1) return "včera";
  if (diffDays < 5) return `před${NBSP}${diffDays}${NBSP}dny`;
  return `před${NBSP}${diffDays}${NBSP}dny`;
}

export function formatFloor(
  floor: number | null | undefined,
  floorsTotal: number | null | undefined,
): string | null {
  if (floor === null || floor === undefined) return null;
  const floorStr =
    floor === 0 ? "Přízemí" : floor < 0 ? `${Math.abs(floor)}.${NBSP}PP` : `${floor}.${NBSP}patro`;
  if (floorsTotal !== null && floorsTotal !== undefined && floorsTotal > 0) {
    return `${floorStr} z${NBSP}${floorsTotal}`;
  }
  return floorStr;
}

export function formatCzechPlural(
  count: number,
  forms: { one: string; few: string; many: string; other: string },
): string {
  const category = csPluralRules.select(count);
  const label = forms[category as keyof typeof forms] ?? forms.other;
  return `${formatNumber(count)}${NBSP}${label}`;
}

export function formatListingCount(count: number): string {
  return formatCzechPlural(count, {
    one: "nabídka",
    few: "nabídky",
    many: "nabídky",
    other: "nabídek",
  });
}

export function formatPhotoCount(count: number): string {
  return formatCzechPlural(count, {
    one: "fotka",
    few: "fotky",
    many: "fotky",
    other: "fotek",
  });
}

export function nbsp(text: string): string {
  // Jednopísmenné české předložky a spojky nesmí zůstat na konci řádku
  return text.replace(/(?<=^|[\s(\u00A0])([ksvzouaiKSVZOUAI]) +/g, `$1${NBSP}`);
}

export const CATEGORY_LABELS: Record<string, string> = {
  flat: "Byty",
  house: "Domy",
  land: "Pozemky",
  commercial: "Komerční",
  other: "Ostatní",
};

export const OFFER_LABELS: Record<string, string> = {
  sale: "Prodej",
  rent: "Pronájem",
};

export const DISPOSITION_LABELS: Record<string, string> = {
  "1+kk": "1+kk",
  "1+1": "1+1",
  "2+kk": "2+kk",
  "2+1": "2+1",
  "3+kk": "3+kk",
  "3+1": "3+1",
  "4+kk": "4+kk",
  "4+1": "4+1",
  "5+kk": "5+kk",
  "5+1": "5+1",
  "6_and_more": "6 a více",
  atypical: "Atypický",
};

export const CONDITION_LABELS: Record<string, string> = {
  new_build: "Novostavba",
  very_good: "Velmi dobrý",
  good: "Dobrý",
  after_renovation: "Po rekonstrukci",
  before_renovation: "Před rekonstrukcí",
  under_construction: "Ve výstavbě",
  project: "Projekt",
  demolition: "K demolici",
};

export const BUILDING_TYPE_LABELS: Record<string, string> = {
  brick: "Cihlová",
  panel: "Panelová",
  wood: "Dřevostavba",
  stone: "Kamenná",
  skeleton: "Skeletová",
  mixed: "Smíšená",
  other: "Ostatní",
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  personal: "Osobní",
  cooperative: "Družstevní",
  state: "Státní / obecní",
  other: "Ostatní",
};

export const FURNISHED_LABELS: Record<string, string> = {
  yes: "Vybaveno",
  partly: "Částečně vybaveno",
  no: "Nevybaveno",
};

export const AMENITY_LABELS: Record<string, string> = {
  balcony: "Balkon",
  terrace: "Terasa",
  loggia: "Lodžie",
  cellar: "Sklep",
  elevator: "Výtah",
  garage: "Garáž",
  parking: "Parkování",
  garden: "Zahrada",
  pool: "Bazén",
  barrier_free: "Bezbariérový",
  ac: "Klimatizace",
  fireplace: "Krb",
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  kraj: "Kraj",
  okres: "Okres",
  obec: "Město / obec",
  cast: "Městská část",
};
