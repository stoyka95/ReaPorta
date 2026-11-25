import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL není nastavena v prostředí (.env).");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    await pool.query("CREATE EXTENSION IF NOT EXISTS unaccent;");
    await pool.query("CREATE EXTENSION IF NOT EXISTS citext;");

    const migrationsFolder = path.resolve(process.cwd(), "drizzle");
    const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
    if (fs.existsSync(journalPath)) {
      const db = drizzle(pool);
      await migrate(db, { migrationsFolder });
      console.log("Migrace úspěšně aplikovány.");
    } else {
      console.log("Složka drizzle/ zatím neobsahuje migrace (rozšíření ověřena).");
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Chyba při migraci databáze:", err);
  process.exit(1);
});
