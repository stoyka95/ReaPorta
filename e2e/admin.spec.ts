import "dotenv/config";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { desc, eq } from "drizzle-orm";
import { getDb, closePool } from "../src/db/client";
import { auditLog, emailOutbox, listings, locations, reports, users } from "../src/db/schema";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  const res = await page.context().request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { "Content-Type": "application/json", Origin: BASE },
    data: { email, password },
  });
  expect(res.ok(), `Přihlášení ${email} selhalo (${res.status()})`).toBeTruthy();
}

test.describe("Etapa 10 — Administrace & RBAC (QA C6, D1–D5)", () => {
  test.afterAll(async () => {
    await closePool();
  });

  test("D5: běžný uživatel i makléř dostanou 403 stránku na /admin a 403 na všech /api/admin/**", async ({
    page,
  }) => {
    await login(page, "uzivatel@reaporta.test", "Heslo12345!");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/nemate-opravneni/);
    await expect(page.getByRole("heading", { name: /Nemáte oprávnění/i })).toBeVisible();

    const apiChecks = [
      await page.context().request.get(`${BASE}/api/admin/agencies`),
      await page
        .context()
        .request.post(`${BASE}/api/admin/moderation/00000000-0000-0000-0000-000000000000`, {
          data: { decision: "approve" },
        }),
      await page
        .context()
        .request.patch(`${BASE}/api/admin/users/00000000-0000-0000-0000-000000000000`, {
          data: { blocked: true },
        }),
      await page
        .context()
        .request.post(`${BASE}/api/admin/reports/00000000-0000-0000-0000-000000000000`, {
          data: { action: "dismiss" },
        }),
      await page.context().request.patch(`${BASE}/api/admin/locations/1`, {
        data: { name: "X", lat: 50, lng: 14 },
      }),
    ];

    for (const res of apiChecks) {
      expect(res.status()).toBe(403);
    }

    // Ověření i pro roli agent (makléř také nesmí do /admin)
    await page.context().clearCookies();
    await login(page, "makler@reaporta.test", "Heslo12345!");
    await page.goto("/admin/moderace");
    await expect(page).toHaveURL(/\/nemate-opravneni/);
    const agentApiRes = await page.context().request.get(`${BASE}/api/admin/agencies`);
    expect(agentApiRes.status()).toBe(403);
  });

  test("D1, D2, C6, D4: přehled, moderace (schválit + zamítnout), zveřejnění na výpisu/mapě a skrytí nahlášení + axe", async ({
    page,
  }) => {
    const db = getDb();
    const [agent] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "makler@reaporta.test"))
      .limit(1);
    const [praha] = await db
      .select({ id: locations.id, name: locations.name, lat: locations.lat, lng: locations.lng })
      .from(locations)
      .where(eq(locations.slug, "praha"))
      .limit(1);
    expect(agent && praha).toBeTruthy();

    const ts = Date.now();
    const approveTitle = `E2E Moderace Schválit ${ts}`;
    const rejectTitle = `E2E Moderace Zamítnout ${ts}`;
    const reportTitle = `E2E Nahlášený Byt ${ts}`;

    const [toApprove] = await db
      .insert(listings)
      .values({
        slug: `e2e-approve-${ts}`,
        agentId: agent!.id,
        status: "pending",
        offerType: "sale",
        category: "flat",
        disposition: "2+kk",
        title: approveTitle,
        description: "Testovací nabídka připravená ke schválení administrátorem.",
        price: "7450000",
        priceUnit: "total",
        locationId: praha!.id,
        city: "Praha",
        lat: 50.087,
        lng: 14.421,
        usableArea: "56",
      })
      .returning({ id: listings.id, slug: listings.slug });

    const [toReject] = await db
      .insert(listings)
      .values({
        slug: `e2e-reject-${ts}`,
        agentId: agent!.id,
        status: "pending",
        offerType: "sale",
        category: "flat",
        title: rejectTitle,
        description: "Testovací nabídka určená k zamítnutí.",
        price: "4990000",
        priceUnit: "total",
        locationId: praha!.id,
        city: "Praha",
        lat: 50.081,
        lng: 14.43,
        usableArea: "42",
      })
      .returning({ id: listings.id });

    const [reportedListing] = await db
      .insert(listings)
      .values({
        slug: `e2e-reported-${ts}`,
        agentId: agent!.id,
        status: "active",
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
        offerType: "sale",
        category: "flat",
        title: reportTitle,
        description: "Aktivní inzerát, který bude po nahlášení skryt.",
        price: "6100000",
        priceUnit: "total",
        locationId: praha!.id,
        city: "Praha",
        lat: 50.075,
        lng: 14.438,
        usableArea: "50",
      })
      .returning({ id: listings.id, slug: listings.slug });

    const [openReport] = await db
      .insert(reports)
      .values({
        listingId: reportedListing!.id,
        reason: "fraud",
        details: "E2E testovací podezřelý inzerát",
        status: "open",
      })
      .returning({ id: reports.id });

    try {
      await login(page, "admin@reaporta.test", "Heslo12345!");

      // D1: Přehled s frontou
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Administrace" })).toBeVisible();
      await expect(page.getByText("Čeká na moderaci")).toBeVisible();

      const axeOverview = await new AxeBuilder({ page }).analyze();
      expect(
        axeOverview.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
      ).toEqual([]);

      // D2: Moderace — schválit a zamítnout s důvodem
      await page.goto("/admin/moderace");
      await expect(page.getByText(approveTitle)).toBeVisible();
      await expect(page.getByText(rejectTitle)).toBeVisible();

      const approveCard = page
        .locator("div")
        .filter({ hasText: approveTitle })
        .filter({
          has: page.getByRole("button", { name: "Schválit" }),
        })
        .last();
      await approveCard.getByRole("button", { name: "Schválit" }).click();
      await expect(page.getByText(approveTitle)).toHaveCount(0, { timeout: 10_000 });

      const rejectCard = page
        .locator("div")
        .filter({ hasText: rejectTitle })
        .filter({
          has: page.getByRole("button", { name: "Zamítnout" }),
        })
        .last();
      await rejectCard.getByRole("button", { name: "Zamítnout" }).click();
      await page.getByLabel(/Důvod zamítnutí/i).fill("Chybí fotografie interiéru a PENB.");
      await page.getByRole("button", { name: "Potvrdit zamítnutí" }).click();
      await expect(page.getByText(rejectTitle)).toHaveCount(0, { timeout: 10_000 });

      // Ověřit email_outbox a audit_log v DB
      const latestEmails = await db
        .select()
        .from(emailOutbox)
        .where(eq(emailOutbox.toEmail, "makler@reaporta.test"))
        .orderBy(desc(emailOutbox.createdAt))
        .limit(5);
      expect(latestEmails.some((e) => e.text.includes(approveTitle))).toBeTruthy();
      expect(latestEmails.some((e) => e.text.includes("Chybí fotografie interiéru"))).toBeTruthy();

      const latestAudits = await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(5);
      expect(
        latestAudits.some((a) => a.action === "listing.approve" && a.entityId === toApprove!.id),
      ).toBeTruthy();
      expect(
        latestAudits.some((a) => a.action === "listing.reject" && a.entityId === toReject!.id),
      ).toBeTruthy();

      // C6: Schválený inzerát je dostupný na veřejném vyhledávání i map API
      const searchRes = await page
        .context()
        .request.get(
          `${BASE}/api/search?offerType=sale&category=flat&q=${encodeURIComponent(String(ts))}`,
        );
      const searchJson = (await searchRes.json()) as { items: Array<{ id: string }> };
      expect(searchJson.items.some((i) => i.id === toApprove!.id)).toBeTruthy();

      const mapRes = await page
        .context()
        .request.get(
          `${BASE}/api/search/map?offerType=sale&category=flat&q=${encodeURIComponent(String(ts))}`,
        );
      const mapJson = (await mapRes.json()) as { points: Array<{ id: string }> };
      expect(mapJson.points.some((p) => p.id === toApprove!.id)).toBeTruthy();

      // D4: Vyřešit nahlášení (skrýt inzerát) → zmizí z veřejných výpisů
      await page.goto("/admin/nahlaseni");
      await expect(page.getByText(reportTitle)).toBeVisible();
      const reportCard = page
        .locator("div")
        .filter({ hasText: reportTitle })
        .filter({
          has: page.getByRole("button", { name: "Skrýt inzerát" }),
        })
        .last();
      await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes(`/api/admin/reports/${openReport!.id}`) && res.status() === 200,
        ),
        reportCard.getByRole("button", { name: "Skrýt inzerát" }).click(),
      ]);

      const afterHideRes = await page
        .context()
        .request.get(
          `${BASE}/api/search?offerType=sale&category=flat&q=${encodeURIComponent(reportTitle)}`,
        );
      const afterHideJson = (await afterHideRes.json()) as { items: Array<{ id: string }> };
      expect(afterHideJson.items.some((i) => i.id === reportedListing!.id)).toBeFalsy();
    } finally {
      await db.delete(reports).where(eq(reports.id, openReport!.id));
      await db.delete(listings).where(eq(listings.id, toApprove!.id));
      await db.delete(listings).where(eq(listings.id, toReject!.id));
      await db.delete(listings).where(eq(listings.id, reportedListing!.id));
    }
  });

  test("D3: zablokovaný uživatel se nemůže přihlásit", async ({ page, browser }) => {
    const db = getDb();
    try {
      await login(page, "admin@reaporta.test", "Heslo12345!");
      await page.goto("/admin/uzivatele");
      await page.getByLabel("Vyhledat uživatele").fill("uzivatel@reaporta.test");

      const row = page.locator("tr", { hasText: "uzivatel@reaporta.test" });
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "Zablokovat" }).click();
      await expect(row.getByText("Zablokován")).toBeVisible({ timeout: 10_000 });

      // Nový čistý kontext: zablokovaný uživatel se zkusí přihlásit
      const blockedCtx = await browser.newContext();
      const blockedPage = await blockedCtx.newPage();
      await blockedPage.goto(`${BASE}/prihlaseni`);
      await blockedPage.getByLabel("E-mail").fill("uzivatel@reaporta.test");
      await blockedPage.getByLabel("Heslo").fill("Heslo12345!");
      await blockedPage.getByRole("button", { name: "Přihlásit se" }).click();
      await expect(blockedPage.locator("form [role='alert']")).toContainText(/zablokován/i);
      await blockedCtx.close();

      // Odblokovat zpět pro další testy
      await row.getByRole("button", { name: "Odblokovat" }).click();
      await expect(row.getByText("Aktivní")).toBeVisible({ timeout: 10_000 });
    } finally {
      await db
        .update(users)
        .set({ blockedAt: null })
        .where(eq(users.email, "uzivatel@reaporta.test"));
    }
  });
});
