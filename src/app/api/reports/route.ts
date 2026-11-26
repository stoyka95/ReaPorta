import { NextResponse } from "next/server";
import { createReportRecord, getListingContactInfo } from "@/db/queries/listing-actions";
import { reportSchema } from "@/features/inquiries/schema";
import { consumeRateLimit, extractClientIp, hashIp } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export async function POST(request: Request) {
  const ipHash = hashIp(extractClientIp(request));
  const limit = await consumeRateLimit({
    key: `report:${ipHash}`,
    limit: 10,
    windowSeconds: 3600,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Překročili jste limit nahlášení. Zkuste to prosím později." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný formát požadavku." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatné údaje nahlášení." },
      { status: 400 },
    );
  }

  try {
    const listing = await getListingContactInfo(parsed.data.listingId);
    if (!listing) {
      return NextResponse.json({ error: "Nabídka nebyla nalezena." }, { status: 404 });
    }

    const report = await createReportRecord({
      listingId: listing.id,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    });

    return NextResponse.json({ id: report.id, status: "ok" }, { status: 201 });
  } catch (error) {
    log.error("create_report_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Nahlášení se nepodařilo uložit." }, { status: 500 });
  }
}
