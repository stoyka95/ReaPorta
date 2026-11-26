import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";

export function hashIp(ip: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? "reaporta-ip-salt";
  return crypto.createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function consumeRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const db = getDb();
  const now = new Date();
  const nextReset = new Date(now.getTime() + params.windowSeconds * 1000);

  const [row] = await db
    .insert(rateLimits)
    .values({
      key: params.key,
      count: 1,
      resetAt: nextReset,
    })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${now} THEN ${nextReset} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning();

  const count = row?.count ?? 1;
  const resetAt = row?.resetAt ?? nextReset;

  return {
    allowed: count <= params.limit,
    remaining: Math.max(0, params.limit - count),
    resetAt,
  };
}

export async function resetRateLimitKey(key: string): Promise<void> {
  const db = getDb();
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}
