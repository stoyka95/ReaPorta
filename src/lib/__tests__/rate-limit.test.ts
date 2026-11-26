import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool } from "@/db/client";
import { resetEnvCache } from "@/lib/env";
import { consumeRateLimit, hashIp, resetRateLimitKey } from "@/lib/rate-limit";

const TEST_DB_URL = "postgres://postgres:postgres@localhost:5432/reaporta_test";

describe("DB rate limiter (reaporta_test)", () => {
  const originalDbUrl = process.env.DATABASE_URL;
  const testKey = "test:inquiry:unit-check";

  beforeAll(async () => {
    await closePool();
    process.env.DATABASE_URL = TEST_DB_URL;
    resetEnvCache();
    await resetRateLimitKey(testKey);
  });

  afterAll(async () => {
    await resetRateLimitKey(testKey);
    await closePool();
    process.env.DATABASE_URL = originalDbUrl;
    resetEnvCache();
  });

  it("enforces 5 requests per window and blocks the 6th", async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await consumeRateLimit({ key: testKey, limit: 5, windowSeconds: 3600 });
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(5 - i);
    }
    const sixth = await consumeRateLimit({ key: testKey, limit: 5, windowSeconds: 3600 });
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  it("hashes IP addresses deterministically without exposing raw IP", () => {
    const h = hashIp("203.0.113.42");
    expect(h).toHaveLength(64);
    expect(h).not.toContain("203.0.113.42");
    expect(hashIp("203.0.113.42")).toBe(h);
  });
});
