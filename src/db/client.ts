import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getEnv } from "@/lib/env";

declare global {
  var __reaportaPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__reaportaPool) {
    const env = getEnv();
    globalThis.__reaportaPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
    });
  }
  return globalThis.__reaportaPool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export function extractDatabaseName(connectionString: string): string {
  const parsed = new URL(connectionString);
  return parsed.pathname.replace(/^\//, "");
}

export function assertSafeDevOrTestDatabase(connectionString: string): string {
  const dbName = extractDatabaseName(connectionString);
  if (!/(dev|test)/i.test(dbName)) {
    throw new Error(
      `Bezpečnostní pojistka: operace je zakázána nad databází "${dbName}" (název musí obsahovat "dev" nebo "test").`,
    );
  }
  return dbName;
}

export async function closePool(): Promise<void> {
  if (globalThis.__reaportaPool) {
    await globalThis.__reaportaPool.end();
    globalThis.__reaportaPool = undefined;
  }
}
