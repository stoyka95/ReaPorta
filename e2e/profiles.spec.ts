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

test.describe("Stage 9 — Inquiries, Stats, Agent & Agency Profiles (C10, C11)", () => {
  test("C10: agent inquiry inbox status workflow (read -> replied -> archived) + stats & profile + axe", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });

    // Vytvořit testovací novou poptávku pro makler@reaporta.test
    const testInqId = await withDb(async (pool) => {
      await pool.query(`DELETE FROM rate_limits WHERE key LIKE 'auth:%'`);
      const agent = await pool.query<{ id: string }>(
        `SELECT id FROM users WHERE email = 'makler@reaporta.test' LIMIT 1`,
      );
      const listing = await pool.query<{ id: string }>(
        `SELECT id FROM listings WHERE agent_id = $1 AND status = 'active' LIMIT 1`,
        [agent.rows[0]!.id],
      );
      const ins = await pool.query<{ id: string }>(
        `INSERT INTO inquiries (listing_id, agent_id, name, email, phone, message, status, ip_hash)
         VALUES ($1, $2, 'Karel Poptávka E2E', 'karel-e2e@example.test', '+420 603 111 222', 'Prosím o termín prohlídky.', 'new', 'e2e-c10')
         RETURNING id`,
        [listing.rows[0]!.id, agent.rows[0]!.id],
      );
      return ins.rows[0]!.id;
    });

    try {
      await page.goto("/prihlaseni?next=/dashboard/poptavky", { waitUntil: "load" });
      await page.getByLabel("E-mail").fill("makler@reaporta.test");
      await page.getByLabel("Heslo").fill("Heslo12345!");
      await page.getByRole("button", { name: "Přihlásit se" }).click();
      await expect(page).toHaveURL(/^https?:\/\/[^/]+\/dashboard\/poptavky$/, {
        timeout: 15_000,
      });

      const card = page.locator(`[data-inquiry-id="${testInqId}"]`);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("data-inquiry-status", "new");

      // Označit jako přečtenou
      await card.getByRole("button", { name: "Označit jako přečtenou" }).click();
      await expect(card).toHaveAttribute("data-inquiry-status", "read", { timeout: 10_000 });

      // Označit jako zodpovězenou
      await card.getByRole("button", { name: "Označit jako zodpovězenou" }).click();
      await expect(card).toHaveAttribute("data-inquiry-status", "replied", { timeout: 10_000 });

      // Archivovat
      await card.getByRole("button", { name: "Archivovat" }).click();
      await expect(card).toHaveAttribute("data-inquiry-status", "archived", { timeout: 10_000 });
      await expect(card.getByRole("button", { name: "Označit jako zodpovězenou" })).toBeEnabled({
        timeout: 10_000,
      });

      // Axe na /dashboard/poptavky
      const inboxAxe = await new AxeBuilder({ page }).analyze();
      expect(
        inboxAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
      ).toEqual([]);

      // Statistiky + profil makléře načtou čistě
      await page.goto("/dashboard/statistiky", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: "Statistiky výkonu" })).toBeVisible();

      await page.goto("/dashboard/profil", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: "Profil makléře" })).toBeVisible();
    } finally {
      await withDb(async (pool) => {
        await pool.query(`DELETE FROM inquiries WHERE id = $1`, [testInqId]);
      });
    }
  });

  test("C11: public /makleri, /makleri/[slug], /agentury/[slug] render cleanly with axe 0 violations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto("/makleri", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "Makléři" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tereza Novotná" })).toBeVisible();

    const dirAxe = await new AxeBuilder({ page }).analyze();
    expect(
      dirAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    await page.getByRole("link", { name: "Tereza Novotná" }).click();
    await expect(page).toHaveURL(/\/makleri\/tereza-novotna/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Aktivní nabídky makléře" })).toBeVisible();

    const agentAxe = await new AxeBuilder({ page }).analyze();
    expect(
      agentAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    await page.goto("/agentury/bohemia-home-reality", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: "Bohemia Home Reality" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Aktivní nabídky kanceláře" })).toBeVisible();

    const agencyAxe = await new AxeBuilder({ page }).analyze();
    expect(
      agencyAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);
  });
});
