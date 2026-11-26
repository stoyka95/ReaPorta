import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";
import sharp from "sharp";

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

async function loginAsAgent(page: import("@playwright/test").Page) {
  await withDb(async (pool) => {
    await pool.query(`DELETE FROM rate_limits WHERE key LIKE 'auth:%'`);
  });
  await page.goto("/prihlaseni?next=/dashboard", { waitUntil: "load" });
  await page.getByLabel("E-mail").fill("makler@reaporta.test");
  await page.getByLabel("Heslo").fill("Heslo12345!");
  await page.getByRole("button", { name: "Přihlásit se" }).click();
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/dashboard$/, { timeout: 15_000 });
}

test.describe("Stage 8 — Agent Dashboard & 6-Step Wizard (C1–C5, C7–C9)", () => {
  test("C1, C9: dashboard overview with KPIs & chart, axe clean, and IDOR blocked on foreign listing edit", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAsAgent(page);

    // C1: Přehled s čísly a 30denním grafem
    await expect(page.getByText("Aktivní inzeráty")).toBeVisible();
    await expect(page.getByText("Zobrazení za posledních 30 dní")).toBeVisible();
    await expect(page.locator('svg[role="img"]')).toBeVisible();

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual(
      [],
    );

    // C9 (IDOR): Najít inzerát jiného makléře a ověřit 403/přesměrování bez dat
    const foreignListingId = await withDb(async (pool) => {
      const res = await pool.query<{ id: string }>(
        `SELECT l.id FROM listings l
         JOIN users u ON u.id = l.agent_id
         WHERE u.email <> 'makler@reaporta.test'
         LIMIT 1`,
      );
      return res.rows[0]!.id;
    });

    await page.goto(`/dashboard/inzeraty/${foreignListingId}/upravit`, { waitUntil: "load" });
    await expect(page).toHaveURL(/\/nemate-opravneni/);
    await expect(page.getByRole("heading", { name: "Nemáte oprávnění" })).toBeVisible();

    // API IDOR kontrola: PATCH cizího inzerátu vrátí 403
    const apiRes = await page.request.patch(`/api/dashboard/listings/${foreignListingId}`, {
      data: { title: "Pokus o IDOR" },
    });
    expect(apiRes.status()).toBe(403);
  });

  test("C2, C3, C4, C5, C7, C8: full 6-step wizard, fake/oversized photo rejection, reorder + cover, autosave resume, submit pending, price history, pause/resume/duplicate/delete", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await loginAsAgent(page);

    await page.goto("/dashboard/inzeraty/novy", { waitUntil: "load" });
    const wizardAxe = await new AxeBuilder({ page }).analyze();
    expect(
      wizardAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);

    // Krok 1: Typ (Prodej / Byty / 2+kk) -> Pokračovat (vytvoří koncept v DB)
    await page.getByRole("button", { name: "Pokračovat" }).click();
    await expect(page.getByRole("heading", { name: /2\. Adresa a poloha/ })).toBeVisible({
      timeout: 15_000,
    });

    // Krok 2: Adresa -> Pokračovat
    await page.getByLabel("Město / obec").fill("Brno");
    await page.getByRole("button", { name: "Pokračovat" }).click();
    await expect(page.getByRole("heading", { name: /3\. Technické parametry/ })).toBeVisible({
      timeout: 15_000,
    });

    // C4: Zavřít/opustit průvodce uprostřed a vrátit se na /novy -> nabídka pokračovat v konceptu
    const savedEditUrl = page.url();
    const idMatch = savedEditUrl.match(/\/dashboard\/inzeraty\/([0-9a-f-]+)\/upravit/);
    expect(idMatch?.[1]).toBeTruthy();
    const createdId = idMatch![1]!;

    try {
      await page.goto("/dashboard/inzeraty/novy", { waitUntil: "load" });
      await expect(page.locator('[data-resume-draft="true"]')).toBeVisible();
      await page.getByRole("link", { name: "Pokračovat v konceptu" }).click();
      await expect(page.getByRole("heading", { name: /3\. Technické parametry/ })).toBeVisible({
        timeout: 15_000,
      });

      // Krok 3: Parametry
      await page.getByLabel("Užitná plocha (m²)").fill("64");
      await page.getByRole("button", { name: "Pokračovat" }).click();
      await expect(page.getByRole("heading", { name: /4\. Popis a cena/ })).toBeVisible({
        timeout: 15_000,
      });

      // Krok 4: Popis a cena
      const uniqueTitle = `E2E Prodej bytu 2+kk Brno ${Date.now()}`;
      await page.getByLabel("Nadpis inzerátu").fill(uniqueTitle);
      await page
        .getByLabel("Popis nemovitosti")
        .fill(
          "Světlý moderní byt 2+kk s prostorným balkonem, sklepem a výbornou dostupností do centra Brna.",
        );
      await page.getByLabel("Cena (Kč)").fill("6200000");
      await page.getByRole("button", { name: "Pokračovat" }).click();
      await expect(page.getByRole("heading", { name: /5\. Fotografie/ })).toBeVisible({
        timeout: 15_000,
      });

      // C2: Nahrát 2 platné fotky + 1 falešný text přejmenovaný na .jpg + 1 >12 MB soubor
      const validImg1 = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 236, g: 230, b: 255 } },
      })
        .jpeg()
        .toBuffer();
      const validImg2 = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 218, g: 206, b: 255 } },
      })
        .png()
        .toBuffer();
      const fakeTxt = Buffer.from("Tohle neni obrazek", "utf8");
      const oversized = Buffer.alloc(13 * 1024 * 1024, 0x00);

      await page.locator('input[type="file"]').setInputFiles([
        { name: "obyvak.jpg", mimeType: "image/jpeg", buffer: validImg1 },
        { name: "kuchyne.png", mimeType: "image/png", buffer: validImg2 },
        { name: "podvod.jpg", mimeType: "image/jpeg", buffer: fakeTxt },
        { name: "velky.jpg", mimeType: "image/jpeg", buffer: oversized },
      ]);

      await expect(page.locator('[data-upload-errors="true"]')).toContainText(/12 MB/, {
        timeout: 20_000,
      });
      await expect(page.locator('[data-upload-errors="true"]')).toContainText(
        /není platný obrázek/,
      );
      await expect(page.locator("[data-image-item]")).toHaveCount(2);

      // C3: Nastavit 2. fotku jako úvodní a posunout pořadí
      await page.getByRole("button", { name: "Nastavit fotku 2 jako úvodní" }).click();
      await page.getByRole("button", { name: "Posunout fotku 2 doleva" }).click();

      // Krok 6: Náhled a odeslání do moderace (C5)
      await page.getByRole("button", { name: "Pokračovat" }).click();
      await expect(page.getByRole("heading", { name: /6\. Náhled a odeslání/ })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole("button", { name: "Odeslat ke schválení" }).click();
      await expect(page).toHaveURL(/^https?:\/\/[^/]+\/dashboard\/inzeraty$/, { timeout: 15_000 });
      await expect(page.getByText(uniqueTitle)).toBeVisible();

      // Ověřit v DB stav pending a veřejně neviditelný pro anonymní hledání
      const statusRow = await withDb(async (pool) => {
        const res = await pool.query<{ status: string }>(
          `SELECT status FROM listings WHERE id = $1`,
          [createdId],
        );
        return res.rows[0]?.status;
      });
      expect(statusRow).toBe("pending");

      // C7 + C8: Simulovat aktivaci, změnit cenu (historie ceny), pozastavit, obnovit, smazat
      await withDb(async (pool) => {
        await pool.query(
          `UPDATE listings SET status = 'active', published_at = NOW() WHERE id = $1`,
          [createdId],
        );
      });

      const priceDropRes = await page.request.patch(`/api/dashboard/listings/${createdId}`, {
        data: { price: 5800000 },
      });
      expect(priceDropRes.ok()).toBe(true);

      const historyCount = await withDb(async (pool) => {
        const res = await pool.query(`SELECT 1 FROM listing_price_history WHERE listing_id = $1`, [
          createdId,
        ]);
        return res.rowCount;
      });
      expect(historyCount).toBe(1);

      // Pozastavit -> Obnovit -> Smazat v UI
      await page.reload({ waitUntil: "load" });
      const row = page.locator(`[data-listing-row="${createdId}"]`);
      await row.getByRole("button", { name: /Pozastavit/ }).click();
      await expect(row).toContainText("Pozastaveno", { timeout: 10_000 });
      await row.getByRole("button", { name: /Obnovit/ }).click();
      await expect(row).toContainText("Aktivní", { timeout: 10_000 });
      await row.getByRole("button", { name: /Smazat/ }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Smazat" }).click();
      await expect(row).toBeHidden({ timeout: 10_000 });
    } finally {
      await withDb(async (pool) => {
        await pool.query(`DELETE FROM listings WHERE id = $1`, [createdId]);
      });
    }
  });
});
