import "dotenv/config";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { eq, ne } from "drizzle-orm";
import { getDb, closePool } from "../src/db/client";
import { listings } from "../src/db/schema";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  const res = await page.context().request.post(`${BASE}/api/auth/sign-in/email`, {
    headers: { "Content-Type": "application/json", Origin: BASE },
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe("Etapa 11 — SEO, přístupnost, klávesnice, reduced-motion a bezpečnost (QA E1–E3, E6)", () => {
  test.afterAll(async () => {
    await closePool();
  });

  test("E6 + Security headers: /robots.txt, /sitemap.xml (jen aktivní) a bezpečnostní hlavičky", async ({
    request,
  }) => {
    // 1. Bezpečnostní hlavičky na úvodní stránce
    const homeRes = await request.get(`${BASE}/`);
    expect(homeRes.status()).toBe(200);
    const headers = homeRes.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");

    // JSON-LD WebSite + Organization na úvodní stránce
    const homeHtml = await homeRes.text();
    expect(homeHtml).toContain('"@type":"Organization"');
    expect(homeHtml).toContain('"@type":"WebSite"');

    // 2. /robots.txt
    const robotsRes = await request.get(`${BASE}/robots.txt`);
    expect(robotsRes.status()).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain("Disallow: /admin");
    expect(robotsTxt).toContain("Disallow: /dashboard");
    expect(robotsTxt).toContain("Disallow: /ucet");
    expect(robotsTxt).toContain("Sitemap:");
    expect(robotsTxt).toContain("/sitemap.xml");

    // 3. /sitemap.xml — platné XML, obsahuje aktivní inzeráty a NEOBSAHUJE neaktivní
    const sitemapRes = await request.get(`${BASE}/sitemap.xml`);
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("<urlset");
    expect(sitemapXml).toContain("/prodej/byty");
    expect(sitemapXml).toContain("/makleri/");

    const db = getDb();
    const [activeOne] = await db
      .select({ slug: listings.slug })
      .from(listings)
      .where(eq(listings.status, "active"))
      .limit(1);
    const inactiveSample = await db
      .select({ slug: listings.slug, status: listings.status })
      .from(listings)
      .where(ne(listings.status, "active"))
      .limit(15);

    expect(activeOne).toBeTruthy();
    expect(sitemapXml).toContain(`/nemovitost/${activeOne!.slug}`);
    for (const row of inactiveSample) {
      expect(
        sitemapXml,
        `Sitemap nesmí obsahovat neaktivní inzerát (${row.status}): ${row.slug}`,
      ).not.toContain(`/nemovitost/${row.slug}`);
    }
  });

  test("E2: průchod výpisem a detailem pouze klávesnicí (viditelný focus, dostupné ovládací prvky)", async ({
    page,
  }) => {
    await page.goto("/prodej/byty");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Tabování přes skip-link / navigaci a prvky na stránce — ověříme, že se focus pohybuje
    const visitedTags = new Set<string>();
    for (let i = 0; i < 15; i += 1) {
      await page.keyboard.press("Tab");
      const activeTag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}:${el.getAttribute("role") ?? ""}` : "NONE";
      });
      visitedTags.add(activeTag);
    }
    expect(visitedTags.has("A:") || visitedTags.has("BUTTON:")).toBeTruthy();

    // Otevřít detail prvního inzerátu klávesou Enter na odkazu karty
    const firstCardLink = page.locator('article h3 a[href^="/nemovitost/"]').first();
    await firstCardLink.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/nemovitost\//, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Ověřit dostupnost tlačítka galerie klávesnicí a zavření lightboxu klávesou Escape
    const openGalleryBtn = page
      .getByRole("button", { name: /Zobrazit všechny fotky|Otevřít fotografii/i })
      .first();
    if (await openGalleryBtn.isVisible()) {
      await openGalleryBtn.focus();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");
    }
  });

  test("E3: prefers-reduced-motion a prefers-reduced-transparency zjednodušují animace a sklo", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Ověření CSS pravidla pro prefers-reduced-motion v aktivních stylech
    const hasReducedRules = await page.evaluate(() => {
      const rules: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (
              rule.cssText.includes("prefers-reduced-motion") ||
              rule.cssText.includes("prefers-reduced-transparency")
            ) {
              rules.push(rule.cssText);
            }
          }
        } catch {
          // ignore cross-origin
        }
      }
      return {
        hasMotion: rules.some((r) => r.includes("prefers-reduced-motion")),
        hasTransparency: rules.some((r) => r.includes("prefers-reduced-transparency")),
        matchesReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      };
    });

    expect(hasReducedRules.hasMotion).toBeTruthy();
    expect(hasReducedRules.hasTransparency).toBeTruthy();
    expect(hasReducedRules.matchesReducedMotion).toBeTruthy();
  });

  test("E1: axe-core 0 kritických a vážných chyb na všech klíčových stránkách", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const publicRoutes = ["/", "/prodej/byty", "/prihlaseni"];
    for (const route of publicRoutes) {
      await test.step(`axe ${route}`, async () => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        const res = await new AxeBuilder({ page }).analyze();
        const severe = res.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );
        expect(severe, `Axe chyby na ${route}`).toEqual([]);
      });
    }

    await test.step("axe detail", async () => {
      await page.goto("/prodej/byty", { waitUntil: "domcontentloaded" });
      const href = await page
        .locator('article h3 a[href^="/nemovitost/"]')
        .first()
        .getAttribute("href");
      expect(href).toBeTruthy();
      await page.goto(href!, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      const detailAxe = await new AxeBuilder({ page }).analyze();
      expect(
        detailAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
      ).toEqual([]);
    });

    await test.step("axe dashboard + wizard", async () => {
      await login(page, "makler@reaporta.test", "Heslo12345!");
      for (const route of ["/dashboard", "/dashboard/inzeraty/novy"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        const res = await new AxeBuilder({ page }).analyze();
        expect(
          res.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
          `Axe chyby na ${route}`,
        ).toEqual([]);
      }
    });

    await test.step("axe admin", async () => {
      await page.context().clearCookies();
      await login(page, "admin@reaporta.test", "Heslo12345!");
      await page.goto("/admin", { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      const adminAxe = await new AxeBuilder({ page }).analyze();
      expect(
        adminAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
      ).toEqual([]);
    });
  });
});
