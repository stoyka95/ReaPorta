import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";
import {
  parseBboxString,
  searchFiltersSchema,
  SORT_OPTIONS,
  type ListingCategory,
  type OfferType,
  type SearchFilters,
  type SortOption,
} from "./schema";

export const VIEW_MODES = ["grid", "list"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const searchUrlParsers = {
  loc: parseAsArrayOf(parseAsString, ",").withDefault([]),
  cenaOd: parseAsInteger,
  cenaDo: parseAsInteger,
  plochaOd: parseAsInteger,
  plochaDo: parseAsInteger,
  pozemekOd: parseAsInteger,
  pozemekDo: parseAsInteger,
  dispozice: parseAsArrayOf(parseAsString, ",").withDefault([]),
  stav: parseAsArrayOf(parseAsString, ",").withDefault([]),
  stavba: parseAsArrayOf(parseAsString, ",").withDefault([]),
  vlastnictvi: parseAsArrayOf(parseAsString, ",").withDefault([]),
  patroOd: parseAsInteger,
  patroDo: parseAsInteger,
  penb: parseAsArrayOf(parseAsString, ",").withDefault([]),
  vybaveni: parseAsArrayOf(parseAsString, ",").withDefault([]),
  vybaveno: parseAsString,
  od: parseAsString,
  stari: parseAsInteger,
  q: parseAsString.withDefault(""),
  bbox: parseAsString,
  razeni: parseAsStringLiteral(SORT_OPTIONS).withDefault("newest"),
  strana: parseAsInteger.withDefault(1),
  zobrazeni: parseAsStringLiteral(VIEW_MODES).withDefault("grid"),
};

export interface UrlFilterState {
  loc: string[];
  cenaOd: number | null;
  cenaDo: number | null;
  plochaOd: number | null;
  plochaDo: number | null;
  pozemekOd: number | null;
  pozemekDo: number | null;
  dispozice: string[];
  stav: string[];
  stavba: string[];
  vlastnictvi: string[];
  patroOd: number | null;
  patroDo: number | null;
  penb: string[];
  vybaveni: string[];
  vybaveno: string | null;
  od: string | null;
  stari: number | null;
  q: string;
  bbox: string | null;
  razeni: SortOption;
  strana: number;
  zobrazeni: ViewMode;
}

export function buildFiltersFromUrlState(
  route: {
    offerType: OfferType;
    category?: ListingCategory;
    pathLocationSlug?: string | null;
  },
  urlState: UrlFilterState,
): SearchFilters {
  const combinedLocations = Array.from(
    new Set([
      ...(route.pathLocationSlug ? [route.pathLocationSlug] : []),
      ...urlState.loc.filter(Boolean),
    ]),
  );

  const raw = {
    offerType: route.offerType,
    category: route.category,
    locations: combinedLocations,
    priceMin: urlState.cenaOd ?? undefined,
    priceMax: urlState.cenaDo ?? undefined,
    usableAreaMin: urlState.plochaOd ?? undefined,
    usableAreaMax: urlState.plochaDo ?? undefined,
    landAreaMin: urlState.pozemekOd ?? undefined,
    landAreaMax: urlState.pozemekDo ?? undefined,
    dispositions: urlState.dispozice,
    conditions: urlState.stav,
    buildingTypes: urlState.stavba,
    ownerships: urlState.vlastnictvi,
    floorMin: urlState.patroOd ?? undefined,
    floorMax: urlState.patroDo ?? undefined,
    energyClasses: urlState.penb,
    amenities: urlState.vybaveni,
    furnished: urlState.vybaveno || undefined,
    availableFrom: urlState.od || undefined,
    maxAgeDays: urlState.stari ?? undefined,
    q: urlState.q || undefined,
    bbox: parseBboxString(urlState.bbox),
    sort: urlState.razeni,
    page: urlState.strana,
    pageSize: 24,
  };

  const parsed = searchFiltersSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return searchFiltersSchema.parse({
    offerType: route.offerType,
    category: route.category,
    locations: combinedLocations,
    sort: "newest",
    page: 1,
    pageSize: 24,
  });
}

function getStr(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = params[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

function getInt(params: Record<string, string | string[] | undefined>, key: string): number | null {
  const str = getStr(params, key);
  if (!str) return null;
  const n = Number(str);
  return Number.isInteger(n) ? n : null;
}

function getList(params: Record<string, string | string[] | undefined>, key: string): string[] {
  const val = params[key];
  if (!val) return [];
  const joined = Array.isArray(val) ? val.join(",") : val;
  return joined
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseRawSearchParamsToUrlState(
  raw: Record<string, string | string[] | undefined>,
): UrlFilterState {
  const sortCandidate = getStr(raw, "razeni");
  const razeni: SortOption = (SORT_OPTIONS as readonly string[]).includes(sortCandidate ?? "")
    ? (sortCandidate as SortOption)
    : "newest";

  const viewCandidate = getStr(raw, "zobrazeni");
  const zobrazeni: ViewMode = viewCandidate === "list" ? "list" : "grid";

  return {
    loc: getList(raw, "loc"),
    cenaOd: getInt(raw, "cenaOd"),
    cenaDo: getInt(raw, "cenaDo"),
    plochaOd: getInt(raw, "plochaOd"),
    plochaDo: getInt(raw, "plochaDo"),
    pozemekOd: getInt(raw, "pozemekOd"),
    pozemekDo: getInt(raw, "pozemekDo"),
    dispozice: getList(raw, "dispozice"),
    stav: getList(raw, "stav"),
    stavba: getList(raw, "stavba"),
    vlastnictvi: getList(raw, "vlastnictvi"),
    patroOd: getInt(raw, "patroOd"),
    patroDo: getInt(raw, "patroDo"),
    penb: getList(raw, "penb"),
    vybaveni: getList(raw, "vybaveni"),
    vybaveno: getStr(raw, "vybaveno") ?? null,
    od: getStr(raw, "od") ?? null,
    stari: getInt(raw, "stari"),
    q: getStr(raw, "q") ?? "",
    bbox: getStr(raw, "bbox") ?? null,
    razeni,
    strana: Math.max(1, getInt(raw, "strana") ?? 1),
    zobrazeni,
  };
}

export function buildApiQueryString(
  route: { offerType: OfferType; category?: ListingCategory; pathLocationSlug?: string | null },
  state: UrlFilterState,
): string {
  const sp = new URLSearchParams();
  sp.set("offerType", route.offerType);
  if (route.category) sp.set("category", route.category);

  const locs = Array.from(
    new Set([
      ...(route.pathLocationSlug ? [route.pathLocationSlug] : []),
      ...state.loc.filter(Boolean),
    ]),
  );
  if (locs.length > 0) sp.set("loc", locs.join(","));
  if (state.cenaOd !== null) sp.set("cenaOd", String(state.cenaOd));
  if (state.cenaDo !== null) sp.set("cenaDo", String(state.cenaDo));
  if (state.plochaOd !== null) sp.set("plochaOd", String(state.plochaOd));
  if (state.plochaDo !== null) sp.set("plochaDo", String(state.plochaDo));
  if (state.pozemekOd !== null) sp.set("pozemekOd", String(state.pozemekOd));
  if (state.pozemekDo !== null) sp.set("pozemekDo", String(state.pozemekDo));
  if (state.dispozice.length > 0) sp.set("dispozice", state.dispozice.join(","));
  if (state.stav.length > 0) sp.set("stav", state.stav.join(","));
  if (state.stavba.length > 0) sp.set("stavba", state.stavba.join(","));
  if (state.vlastnictvi.length > 0) sp.set("vlastnictvi", state.vlastnictvi.join(","));
  if (state.patroOd !== null) sp.set("patroOd", String(state.patroOd));
  if (state.patroDo !== null) sp.set("patroDo", String(state.patroDo));
  if (state.penb.length > 0) sp.set("penb", state.penb.join(","));
  if (state.vybaveni.length > 0) sp.set("vybaveni", state.vybaveni.join(","));
  if (state.vybaveno) sp.set("vybaveno", state.vybaveno);
  if (state.od) sp.set("od", state.od);
  if (state.stari !== null) sp.set("stari", String(state.stari));
  if (state.q.trim()) sp.set("q", state.q.trim());
  if (state.bbox) sp.set("bbox", state.bbox);
  if (state.razeni !== "newest") sp.set("razeni", state.razeni);
  if (state.strana > 1) sp.set("strana", String(state.strana));
  return sp.toString();
}

export function countActiveFilters(state: UrlFilterState): number {
  let count = 0;
  if (state.cenaOd !== null || state.cenaDo !== null) count++;
  if (state.plochaOd !== null || state.plochaDo !== null) count++;
  if (state.pozemekOd !== null || state.pozemekDo !== null) count++;
  if (state.dispozice.length > 0) count++;
  if (state.stav.length > 0) count++;
  if (state.stavba.length > 0) count++;
  if (state.vlastnictvi.length > 0) count++;
  if (state.patroOd !== null || state.patroDo !== null) count++;
  if (state.penb.length > 0) count++;
  if (state.vybaveni.length > 0) count++;
  if (state.vybaveno) count++;
  if (state.od) count++;
  if (state.stari !== null) count++;
  if (state.q.trim()) count++;
  if (state.bbox) count++;
  return count;
}
