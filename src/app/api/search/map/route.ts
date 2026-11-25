import { NextResponse } from "next/server";
import { searchMapPoints } from "@/db/queries/listings";
import { buildFiltersFromUrlState, parseRawSearchParamsToUrlState } from "@/lib/search/url-params";
import { CATEGORIES, OFFER_TYPES, type ListingCategory, type OfferType } from "@/lib/search/schema";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = performance.now();
  const { searchParams } = new URL(request.url);
  const raw: Record<string, string | undefined> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const offerParam = searchParams.get("offerType");
  const offerType: OfferType = (OFFER_TYPES as readonly string[]).includes(offerParam ?? "")
    ? (offerParam as OfferType)
    : "sale";

  const catParam = searchParams.get("category");
  const category: ListingCategory | undefined = (CATEGORIES as readonly string[]).includes(
    catParam ?? "",
  )
    ? (catParam as ListingCategory)
    : undefined;

  const urlState = parseRawSearchParamsToUrlState(raw);
  const filters = buildFiltersFromUrlState({ offerType, category }, urlState);

  try {
    const points = await searchMapPoints(filters);
    return NextResponse.json({
      points,
      count: points.length,
      queryMs: Math.round(performance.now() - started),
    });
  } catch (error) {
    log.error("api_search_map_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Nepodařilo se načíst body na mapě." }, { status: 500 });
  }
}
