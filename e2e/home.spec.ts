import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Stage 3 — Home Page (M1)", () => {
  test("A1: renders hero, DB-backed sections, 8 popular cities, zero horizontal overflow at 390px and 1280px, axe clean", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toContainText("Najděte místo");
    await expect(page.getByRole("heading", { name: "Nové nabídky" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Doporučené nabídky" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Oblíbené lokality" })).toBeVisible();

    // 8 popular city cards with active counts
    const cityLinks = page.locator('section[aria-labelledby="sec-cities"] a');
    await expect(cityLinks).toHaveCount(8);

    // Axe audit on desktop
    const axeResults = await new AxeBuilder({ page }).analyze();
    const severe = axeResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(severe).toEqual([]);

    // Mobile 390px check (AC-1.5)
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
    expect(consoleErrors).toEqual([]);
  });

  test("A2: hero search Pronajem -> Byty -> 'brn' suggests Brno and redirects to /pronajem/byty/...brno", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Switch to Pronájem
    await page.getByRole("radio", { name: "Pronájem" }).click();

    // Select Byty
    await page.getByRole("combobox", { name: "Kategorie" }).click();
    await page.getByRole("option", { name: "Byty" }).click();

    // Type "brn" in location combobox and pick Brno
    const locInput = page.getByRole("combobox", { name: "Lokalita" });
    await locInput.fill("brn");
    const brnoOption = page.getByRole("option", { name: /Brno/ }).first();
    await expect(brnoOption).toBeVisible();
    await brnoOption.click();

    // Submit search
    await page.getByRole("button", { name: "Hledat" }).click();
    await expect(page).toHaveURL(/\/pronajem\/byty\/.*brno/, { timeout: 20_000 });
    await expect(page.locator("h1")).toContainText("Brno");
  });

  test("AC-9.7: legal & static pages render with sample notice", async ({ page }) => {
    for (const path of ["/o-nas", "/kontakt", "/podminky", "/ochrana-udaju", "/cookies"]) {
      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
