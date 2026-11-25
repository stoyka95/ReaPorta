import { test, expect } from "@playwright/test";

test.describe("Stage 5 — Interactive Map (M3)", () => {
  test("A9, A10, A11: map renders clusters/pins, search-on-move updates bbox & listing URL, pin click opens preview", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/prodej/byty", { waitUntil: "domcontentloaded" });

    const mapView = page.locator('[data-map-view="true"]');
    await expect(mapView).toBeVisible({ timeout: 15_000 });

    // Wait for markers (clusters or individual price pins) to mount
    const anyPin = page.locator('[data-cluster-pin="true"], [data-listing-pin]');
    await expect(anyPin.first()).toBeVisible({ timeout: 15_000 });

    // A10: Enable "Hledat při pohybu mapy" and zoom in -> URL gets bbox param & changes on zoom
    const moveSwitch = page.getByRole("switch", { name: "Hledat při pohybu mapy" });
    await moveSwitch.click();
    await expect(page).toHaveURL(/bbox=/);

    const bboxBeforeZoom = new URL(page.url()).searchParams.get("bbox");
    await page.getByRole("button", { name: "Přiblížit mapu" }).click();
    await page.waitForTimeout(450);
    await page.getByRole("button", { name: "Přiblížit mapu" }).click();
    await page.waitForTimeout(700);
    const bboxAfterZoom = new URL(page.url()).searchParams.get("bbox");
    expect(bboxAfterZoom).not.toBe(bboxBeforeZoom);

    // A11: Navigate to Brno where price pins are visible, hover card & click price pin -> preview card appears
    await page.goto("/prodej/byty/brno", { waitUntil: "domcontentloaded" });
    const pricePin = page.locator("[data-listing-pin]").first();
    await expect(pricePin).toBeVisible({ timeout: 15_000 });
    await pricePin.click();
    await expect(page.getByRole("region", { name: "Náhled vybrané nabídky" })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("A12: mobile 390px floating Mapa button opens fullscreen map and shows preview sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/prodej/byty/brno", { waitUntil: "load" });
    await page.waitForTimeout(400);

    await page.getByRole("button", { name: "Mapa", exact: true }).click();
    const mapDialog = page.getByRole("dialog", { name: "Mapa nemovitostí" });
    await expect(mapDialog).toBeVisible({ timeout: 10_000 });

    const anyPin = mapDialog.locator('[data-listing-pin], [data-cluster-pin="true"]').first();
    await expect(anyPin).toBeVisible({ timeout: 15_000 });
    // If initial zoom clustered pins, zoom in once or click cluster so a price pin is clickable
    if ((await mapDialog.locator("[data-listing-pin]").count()) === 0) {
      await mapDialog.locator('[data-cluster-pin="true"]').first().click();
      await page.waitForTimeout(500);
    }
    const pricePin = mapDialog.locator("[data-listing-pin]").first();
    await expect(pricePin).toBeVisible({ timeout: 15_000 });
    await pricePin.click();
    await expect(mapDialog.getByRole("region", { name: "Náhled vybrané nabídky" })).toBeVisible();

    await mapDialog.getByRole("button", { name: "Zpět na výpis" }).click();
    await expect(mapDialog).toBeHidden();
  });

  test("A20: blocking map tiles shows graceful notice while results list continues working", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route("**/tiles.openfreemap.org/**", (route) => route.abort());

    await page.goto("/prodej/byty", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-map-tile-error="true"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("article").first()).toBeVisible();
  });
});
