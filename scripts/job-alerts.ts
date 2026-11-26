import "dotenv/config";
import { runSavedSearchAlerts } from "../src/lib/alerts";
import { closePool } from "../src/db/client";

async function main(): Promise<void> {
  const forceAll = process.argv.includes("--force");
  const result = await runSavedSearchAlerts({ forceAll });
  console.log(
    `job:alerts hotovo — zkontrolováno: ${result.checked}, odesláno e-mailů: ${result.notified}, shodných nabídek: ${result.totalListingsMatched}`,
  );
  await closePool();
}

main().catch(async (err) => {
  console.error("Chyba při běhu job:alerts:", err);
  await closePool();
  process.exit(1);
});
