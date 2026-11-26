import { execSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";

const DEV_DB_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_dev";

async function withDb<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: DEV_DB_URL });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

test.describe("Stage 7 — Accounts, Favorites, Saved Searches, Alerts (B1–B9)", () => {
  test.beforeEach(async () => {
    // Resetovat rate_limits před každým auth testem
    await withDb(async (pool) => {
      await pool.query(`DELETE FROM rate_limits WHERE key LIKE 'auth:%'`);
    });
  });

  test.afterEach(async () => {
    await withDb(async (pool) => {
      await pool.query(`DELETE FROM rate_limits WHERE key LIKE 'auth:%'`);
    });
  });

  test("B1, B2, B8, B9: duplicate registration, register -> verify -> login, /ucet redirect, password reset + single-use token, account delete", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    // B2 part 1: Nepřihlášený nemá přístup na /ucet (přesměrování s ?next=)
    await page.goto("/ucet", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/prihlaseni\?next=%2Fucet/);

    // Axe na /prihlaseni
    const loginAxe = await new AxeBuilder({ page }).analyze();
    expect(
      loginAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    // B1: Registrace s existujícím e-mailem vrátí srozumitelnou českou chybu
    await page.goto("/registrace", { waitUntil: "load" });
    const regAxe = await new AxeBuilder({ page }).analyze();
    expect(
      regAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    await page.getByLabel("Jméno a příjmení").fill("Existující Test");
    await page.getByLabel("E-mail").fill("uzivatel@reaporta.test");
    await page.getByLabel("Heslo").fill("BezpecneHeslo123!");
    await page.getByRole("button", { name: "Zaregistrovat se" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(
      /Registraci s tímto e-mailem nelze/,
      { timeout: 15_000 },
    );

    // B2: Registrace nového účtu -> ověřovací e-mail v email_outbox -> ověření -> přihlášení
    const uniqueEmail = `e2e-user-${Date.now()}@reaporta.test`;
    await page.getByLabel("Jméno a příjmení").fill("Jan E2E Test");
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByLabel("Heslo").fill("BezpecneHeslo123!");
    await page.getByRole("button", { name: "Zaregistrovat se" }).click();
    await expect(page.locator('[data-register-success="true"]')).toBeVisible({ timeout: 15_000 });

    // Najít ověřovací odkaz v email_outbox
    const verifyUrl = await withDb(async (pool) => {
      const res = await pool.query<{ text: string }>(
        `SELECT text FROM email_outbox WHERE to_email = $1 ORDER BY created_at DESC LIMIT 1`,
        [uniqueEmail],
      );
      const match = res.rows[0]?.text.match(/https?:\/\/[^\s]+\/overeni-emailu\?token=[^\s]+/);
      return match?.[0] ?? null;
    });
    expect(verifyUrl).toBeTruthy();

    await page.goto(verifyUrl!, { waitUntil: "load" });
    await expect(page.locator('[data-verify-status="ok"]')).toBeVisible({ timeout: 15_000 });

    // Přihlášení s novým účtem
    await page.goto("/prihlaseni", { waitUntil: "load" });
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByLabel("Heslo").fill("BezpecneHeslo123!");
    await page.getByRole("button", { name: "Přihlásit se" }).click();
    await expect(page).toHaveURL(/\/ucet/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Jan E2E Test" })).toBeVisible();

    // Axe na /ucet
    const accountAxe = await new AxeBuilder({ page }).analyze();
    expect(
      accountAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    // Odhlásit se a otestovat B8: Zapomenuté heslo -> reset -> starý odkaz neplatí
    await page.getByRole("button", { name: /Menu účtu/ }).click();
    await page.getByRole("button", { name: "Odhlásit se" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

    await page.goto("/zapomenute-heslo", { waitUntil: "load" });
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByRole("button", { name: "Odeslat odkaz pro obnovu" }).click();
    await expect(page.locator('[data-forgot-sent="true"]')).toBeVisible({ timeout: 15_000 });

    const resetUrl = await withDb(async (pool) => {
      const res = await pool.query<{ text: string }>(
        `SELECT text FROM email_outbox WHERE to_email = $1 AND subject LIKE 'Obnova hesla%' ORDER BY created_at DESC LIMIT 1`,
        [uniqueEmail],
      );
      const match = res.rows[0]?.text.match(/https?:\/\/[^\s]+\/obnova-hesla\?token=[^\s]+/);
      return match?.[0] ?? null;
    });
    expect(resetUrl).toBeTruthy();

    await page.goto(resetUrl!, { waitUntil: "load" });
    await page.getByLabel("Nové heslo").fill("NoveHeslo98765!");
    await page.getByLabel("Potvrzení hesla").fill("NoveHeslo98765!");
    await page.getByRole("button", { name: "Uložit nové heslo" }).click();
    await expect(page.locator('[data-reset-success="true"]')).toBeVisible({ timeout: 15_000 });

    // Starý odkaz po použití již neplatí
    await page.goto(resetUrl!, { waitUntil: "load" });
    await page.getByLabel("Nové heslo").fill("JesteJineHeslo123!");
    await page.getByLabel("Potvrzení hesla").fill("JesteJineHeslo123!");
    await page.getByRole("button", { name: "Uložit nové heslo" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(/neplatný|vypršel|použit/, {
      timeout: 15_000,
    });

    // Přihlásit se s novým heslem, vložit oblíbené a poptávku, pak B9: smazat účet
    await page.goto("/prihlaseni", { waitUntil: "load" });
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByLabel("Heslo").fill("NoveHeslo98765!");
    await page.getByRole("button", { name: "Přihlásit se" }).click();
    await expect(page).toHaveURL(/\/ucet/, { timeout: 15_000 });

    const testListingId = await withDb(async (pool) => {
      const u = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [
        uniqueEmail,
      ]);
      const l = await pool.query<{ id: string; agent_id: string }>(
        `SELECT id, agent_id FROM listings WHERE status = 'active' LIMIT 1`,
      );
      const userId = u.rows[0]!.id;
      const listing = l.rows[0]!;
      await pool.query(`INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)`, [
        userId,
        listing.id,
      ]);
      await pool.query(
        `INSERT INTO inquiries (listing_id, agent_id, user_id, name, email, message, status, ip_hash)
         VALUES ($1, $2, $3, 'Jan E2E Test', $4, 'Testovací zpráva před smazáním', 'new', 'hash-e2e')`,
        [listing.id, listing.agent_id, userId, uniqueEmail],
      );
      return { userId, listingId: listing.id };
    });

    await page.goto("/ucet", { waitUntil: "load" });
    await page.getByRole("button", { name: "Smazat účet" }).click();
    await page.getByRole("button", { name: "Trvale smazat účet" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

    // Ověřit v DB: oblíbené pryč, poptávka anonymizovaná, uživatel má deleted_at
    await withDb(async (pool) => {
      const favs = await pool.query(`SELECT 1 FROM favorites WHERE user_id = $1`, [
        testListingId.userId,
      ]);
      expect(favs.rowCount).toBe(0);
      const inqs = await pool.query<{ name: string; email: string; user_id: string | null }>(
        `SELECT name, email, user_id FROM inquiries WHERE ip_hash = 'hash-e2e' AND listing_id = $1`,
        [testListingId.listingId],
      );
      expect(inqs.rows[0]?.user_id).toBeNull();
      expect(inqs.rows[0]?.name).toBe("Smazaný uživatel");
      // Úklid testovacích řádků
      await pool.query(`DELETE FROM inquiries WHERE ip_hash = 'hash-e2e'`);
      await pool.query(`DELETE FROM email_outbox WHERE to_email = $1`, [uniqueEmail]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [testListingId.userId]);
    });
  });

  test("B3: 6 failed logins in a row triggers Czech rate limit message", async ({ page }) => {
    await page.goto("/prihlaseni", { waitUntil: "load" });
    await page.getByLabel("E-mail").fill("uzivatel@reaporta.test");
    await page.getByLabel("Heslo").fill("SpatneHeslo999!");

    const formAlert = page.locator('form [role="alert"]');
    for (let i = 0; i < 6; i++) {
      await page.getByRole("button", { name: "Přihlásit se" }).click();
      await expect(formAlert).toBeVisible({ timeout: 10_000 });
    }

    await expect(formAlert).toContainText(/Příliš mnoho/);
  });

  test("B4, B5, B6, B7: anonymous heart prompts login then saves favorite; favorites & saved searches CRUD; job:alerts sends 1 email and 0 on repeat", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });

    // B5: Nepřihlášený klikne na srdce na kartě -> výzva k přihlášení -> po přihlášení se přidá
    await page.goto("/prodej/byty", { waitUntil: "load" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const firstHeart = page.getByRole("button", { name: "Přidat do oblíbených" }).first();
    await firstHeart.click();
    await expect(page.getByRole("dialog", { name: "Uložit mezi oblíbené" })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("link", { name: "Přihlásit se a uložit" }).click();
    await expect(page).toHaveURL(/\/prihlaseni\?next=.*&favorite=/);

    await page.getByLabel("E-mail").fill("uzivatel2@reaporta.test");
    await page.getByLabel("Heslo").fill("Heslo12345!");
    await page.getByRole("button", { name: "Přihlásit se" }).click();
    await expect(page).toHaveURL(/\/prodej\/byty/, { timeout: 15_000 });

    // B4: Zobrazit v /ucet/oblibene a odebrat
    await page.goto("/ucet/oblibene", { waitUntil: "load" });
    const removeHeart = page.getByRole("button", { name: "Odebrat z oblíbených" }).first();
    await expect(removeHeart).toBeVisible({ timeout: 10_000 });
    await removeHeart.click();

    // B6: Uložit hledání, změnit frekvenci, smazat
    await page.goto("/prodej/byty", { waitUntil: "load" });
    const uniqueSearchName = `E2E Hledání ${Date.now()}`;
    await page.getByRole("button", { name: "Uložit hledání" }).click();
    await page.getByLabel("Název hledání").fill(uniqueSearchName);
    await page.getByRole("button", { name: "Uložit hledání" }).last().click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15_000 });

    await page.goto("/ucet/hledani", { waitUntil: "load" });
    await expect(page.getByText(uniqueSearchName)).toBeVisible({ timeout: 10_000 });

    // B7: Spustit pnpm job:alerts po vytvoření odpovídající nabídky -> 1 e-mail, 2. běh 0
    const createdListingId = await withDb(async (pool) => {
      await pool.query(
        `UPDATE saved_searches SET frequency = 'instant', last_notified_at = NOW() - INTERVAL '10 minutes'
         WHERE name = $1`,
        [uniqueSearchName],
      );
      const agent = await pool.query<{ id: string }>(
        `SELECT id FROM users WHERE email = 'makler@reaporta.test' LIMIT 1`,
      );
      const loc = await pool.query<{ id: number }>(`SELECT id FROM locations LIMIT 1`);
      const ins = await pool.query<{ id: string }>(
        `INSERT INTO listings (slug, agent_id, status, offer_type, category, title, description, price, price_unit, location_id, city, lat, lng, published_at)
         VALUES ($1, $2, 'active', 'sale', 'flat', 'Prodej bytu 2+kk pro hlídacího psa', 'Nová nabídka.', 4800000, 'total', $3, 'Praha', 50.08, 14.43, NOW() - INTERVAL '1 second')
         RETURNING id`,
        [`e2e-alert-${Date.now()}`, agent.rows[0]!.id, loc.rows[0]!.id],
      );
      return ins.rows[0]!.id;
    });

    try {
      const out1 = execSync("pnpm job:alerts", { encoding: "utf8" });
      expect(out1).toContain("odesláno e-mailů: 1");
      const out2 = execSync("pnpm job:alerts", { encoding: "utf8" });
      expect(out2).toContain("odesláno e-mailů: 0");
    } finally {
      await withDb(async (pool) => {
        await pool.query(`DELETE FROM listings WHERE id = $1`, [createdListingId]);
        await pool.query(`DELETE FROM email_outbox WHERE to_email = 'uzivatel2@reaporta.test'`);
      });
    }

    // Smazat uložené hledání v UI
    await page.getByRole("button", { name: `Smazat hledání ${uniqueSearchName}` }).click();
    await expect(page.getByText(uniqueSearchName)).toBeHidden({ timeout: 10_000 });
  });
});
