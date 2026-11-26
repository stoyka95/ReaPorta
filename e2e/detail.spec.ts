import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";

const DEV_DB_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/reaporta_dev";

async function querySlugs() {
  const pool = new Pool({ connectionString: DEV_DB_URL });
  try {
    const [activeSale, approxListing, soldListing, expiredListing] = await Promise.all([
      pool.query<{ slug: string; id: string }>(
        `SELECT l.slug, l.id FROM listings l
         WHERE l.status = 'active' AND l.offer_type = 'sale' AND l.price IS NOT NULL
           AND (SELECT count(*) FROM listing_images i WHERE i.listing_id = l.id) >= 5
         ORDER BY l.published_at DESC LIMIT 1`,
      ),
      pool.query<{ slug: string }>(
        `SELECT slug FROM listings WHERE status = 'active' AND show_exact_location = false LIMIT 1`,
      ),
      pool.query<{ slug: string }>(`SELECT slug FROM listings WHERE status = 'sold' LIMIT 1`),
      pool.query<{ slug: string }>(`SELECT slug FROM listings WHERE status = 'expired' LIMIT 1`),
    ]);
    return {
      activeSale: activeSale.rows[0]!,
      approxSlug: approxListing.rows[0]!.slug,
      soldSlug: soldListing.rows[0]!.slug,
      expiredSlug: expiredListing.rows[0]!.slug,
    };
  } finally {
    await pool.end();
  }
}

test.describe("Stage 6 — Listing Detail (M4)", () => {
  test("A13, A14, A15, A16 + SEO JSON-LD + OG + axe on active sale listing", async ({
    page,
    request,
  }) => {
    const { activeSale } = await querySlugs();
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    const res = await page.goto(`/nemovitost/${activeSale.slug}`, { waitUntil: "load" });
    expect(res?.status()).toBe(200);

    // AC-4.9 / E5: JSON-LD RealEstateListing and canonical exist
    const jsonLdRaw = await page.locator('script[type="application/ld+json"]').textContent();
    expect(jsonLdRaw).toContain("RealEstateListing");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain(`/nemovitost/${activeSale.slug}`);

    // Dynamic OG image meta tag exists and responds 200 image/png
    const ogImageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImageUrl).toBeTruthy();
    const ogRes = await request.get(ogImageUrl!);
    expect(ogRes.status()).toBe(200);
    expect(ogRes.headers()["content-type"]).toContain("image/png");

    // A13: Open lightbox and navigate with keyboard (ArrowRight, ArrowLeft, Escape)
    const showAllBtn = page.getByRole("button", { name: /Zobrazit všech/ });
    await showAllBtn.click();
    const lightbox = page.getByRole("dialog", { name: /Galerie fotografií/ });
    await expect(lightbox).toBeVisible();
    await expect(lightbox).toContainText("1 /");
    await page.keyboard.press("ArrowRight");
    await expect(lightbox).toContainText("2 /");
    await page.keyboard.press("ArrowLeft");
    await expect(lightbox).toContainText("1 /");
    await page.keyboard.press("Escape");
    await expect(lightbox).toBeHidden();

    // A14: Phone number is NOT in HTML before clicking "Zobrazit telefon"
    const htmlBefore = await page.content();
    expect(htmlBefore).not.toContain('data-revealed-phone="true"');
    const revealBtn = page.getByRole("button", { name: "Zobrazit telefon" });
    await revealBtn.click();
    const phoneLink = page.locator('[data-revealed-phone="true"]');
    await expect(phoneLink).toBeVisible({ timeout: 15_000 });
    await expect(phoneLink).toContainText("+420");

    // A16: Mortgage calculator check (5 000 000 Kč, 20%, 5% p.a., 30 years -> 4M loan, ~21 473 Kč)
    await page.getByLabel("Kupní cena (Kč)").fill("5000000");
    await page.getByLabel("Vlastní zdroje (%)").fill("20");
    await page.getByLabel("Úroková sazba (% p. a.)").fill("5");
    await page.getByLabel("Doba splácení (let)").fill("30");
    await expect(page.locator('[data-mortgage-loan="true"]')).toContainText("4\u00A0000\u00A0000");
    const monthlyText = await page.locator('[data-mortgage-monthly="true"]').textContent();
    const monthlyNum = Number((monthlyText ?? "").replace(/[^\d]/g, ""));
    expect(Math.abs(monthlyNum - 21473)).toBeLessThanOrEqual(5);

    // A15: Submit inquiry invalid -> Czech error, then valid -> confirmation + DB inquiry & email_outbox
    const submitBtn = page.getByRole("button", { name: "Odeslat zprávu" });
    await submitBtn.click();
    await expect(page.getByText(/Zadejte prosím své jméno/)).toBeVisible();

    const uniqueEmail = `e2e-${Date.now()}@example.test`;
    await page.getByLabel("Vaše jméno").fill("Petra Testovací");
    await page.getByLabel("E-mail").fill(uniqueEmail);
    await page.getByLabel("Telefon (volitelné)").fill("+420 602 999 888");
    await page.getByRole("checkbox").click();
    await submitBtn.click();
    await expect(page.locator('[data-inquiry-success="true"]')).toBeVisible({ timeout: 15_000 });

    // Verify inquiry + email_outbox rows exist in DB
    const pool = new Pool({ connectionString: DEV_DB_URL });
    try {
      const inq = await pool.query(`SELECT id FROM inquiries WHERE email = $1`, [uniqueEmail]);
      expect(inq.rowCount).toBe(1);
      const outbox = await pool.query(
        `SELECT id FROM email_outbox WHERE to_email = $1 OR html LIKE $2`,
        [uniqueEmail, `%${uniqueEmail}%`],
      );
      expect(outbox.rowCount).toBeGreaterThanOrEqual(2);
      // Clean up test rows & rate limit
      await pool.query(`DELETE FROM inquiries WHERE email = $1`, [uniqueEmail]);
      await pool.query(`DELETE FROM email_outbox WHERE to_email = $1 OR html LIKE $2`, [
        uniqueEmail,
        `%${uniqueEmail}%`,
      ]);
      await pool.query(`DELETE FROM rate_limits WHERE key LIKE 'inquiry:%'`);
    } finally {
      await pool.end();
    }

    // Axe accessibility audit
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(severe).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("A17, A18, A19: sold/expired show banner (not 404), unknown slug shows 404, show_exact_location=false renders circle", async ({
    page,
  }) => {
    const { approxSlug, soldSlug, expiredSlug } = await querySlugs();

    // A17 sold
    const soldRes = await page.goto(`/nemovitost/${soldSlug}`, { waitUntil: "load" });
    expect(soldRes?.status()).toBe(200);
    await expect(page.locator('[data-inactive-banner="true"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Podobné nabídky v okolí" })).toBeVisible();

    // A17 expired
    const expRes = await page.goto(`/nemovitost/${expiredSlug}`, { waitUntil: "load" });
    expect(expRes?.status()).toBe(200);
    await expect(page.locator('[data-inactive-banner="true"]')).toBeVisible();

    // A18 unknown slug -> custom 404
    const nfRes = await page.goto("/nemovitost/neexistujici-slug-999999", { waitUntil: "load" });
    expect(nfRes?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Tuto stránku jsme nenašli." })).toBeVisible();

    // A19 show_exact_location = false -> approximate circle, not exact marker
    await page.goto(`/nemovitost/${approxSlug}`, { waitUntil: "load" });
    await expect(page.locator('[data-approx-circle="true"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-exact-marker="true"]')).toHaveCount(0);
  });
});
