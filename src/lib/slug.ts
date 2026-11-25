const CZECH_MAP: Record<string, string> = {
  á: "a",
  č: "c",
  ď: "d",
  é: "e",
  ě: "e",
  í: "i",
  ň: "n",
  ó: "o",
  ř: "r",
  š: "s",
  ť: "t",
  ú: "u",
  ů: "u",
  ý: "y",
  ž: "z",
};

export function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[áčďéěíňóřšťúůýž]/gi, (ch) => {
      const lower = ch.toLowerCase();
      return CZECH_MAP[lower] ?? ch;
    });
}

export function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/\+/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const CATEGORY_SLUG_LABELS: Record<string, string> = {
  flat: "byt",
  house: "dum",
  land: "pozemek",
  commercial: "komercni",
  other: "nemovitost",
};

export function generateListingSlug(parts: {
  category: string;
  disposition?: string | null;
  locationName: string;
  area?: number | null;
  suffix: string;
}): string {
  const tokens: string[] = [CATEGORY_SLUG_LABELS[parts.category] ?? "nemovitost"];
  if (parts.disposition) {
    tokens.push(parts.disposition === "6_and_more" ? "6-a-vice" : parts.disposition);
  }
  tokens.push(parts.locationName);
  if (parts.area && parts.area > 0) {
    tokens.push(`${Math.round(parts.area)}m2`);
  }
  tokens.push(parts.suffix.toLowerCase());
  return slugify(tokens.join("-"));
}
