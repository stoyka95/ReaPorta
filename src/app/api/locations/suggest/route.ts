import { NextResponse } from "next/server";
import { suggestLocations } from "@/db/queries/locations";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1 || q.length > 80) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await suggestLocations(q, 8);
    return NextResponse.json({ items });
  } catch (error) {
    log.error("locations_suggest_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
