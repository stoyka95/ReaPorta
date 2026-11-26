import { NextRequest, NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/alerts";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Neplatné oprávnění." }, { status: 401 });
  }

  const result = await runSavedSearchAlerts();
  return NextResponse.json({ ok: true, ...result });
}
