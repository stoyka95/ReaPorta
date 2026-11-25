import "dotenv/config";
import { execSync } from "node:child_process";
import { Pool } from "pg";
import { assertSafeDevOrTestDatabase } from "../src/db/client";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL není nastavena v prostředí (.env).");
  }

  const dbName = assertSafeDevOrTestDatabase(databaseUrl);
  const started = Date.now();
  console.log(`Resetuji databázi "${dbName}"...`);

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE;");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
    await pool.query("CREATE SCHEMA public;");
    await pool.query("GRANT ALL ON SCHEMA public TO public;");
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    await pool.query("CREATE EXTENSION IF NOT EXISTS unaccent;");
    await pool.query("CREATE EXTENSION IF NOT EXISTS citext;");
  } finally {
    await pool.end();
  }

  execSync("pnpm db:migrate", { stdio: "inherit" });
  execSync("pnpm db:seed", { stdio: "inherit" });
  console.log(`db:reset dokončen za ${((Date.now() - started) / 1000).toFixed(2)} s.`);
}

main().catch((err) => {
  console.error("Chyba při resetu databáze:", err);
  process.exit(1);
});
