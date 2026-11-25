import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      status: "ok",
      db: "ok",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    log.error("health_check_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        status: "error",
        db: "error",
      },
      { status: 503 },
    );
  }
}
