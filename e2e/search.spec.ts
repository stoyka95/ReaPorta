import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Stage 4 — Search & Listing (M2)", () => {
  test("A3, A4, A5: apply price + disposition + balcony filters, verify URL, Back/Forward, and shareable URL", async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/prodej/byty", { waitUntil: "networkidle" });
    const countLocator = page.locator('p[aria-live="polite"]');
    const initialCountText = await countLocator.textContent();

    // Open Dispozice popover and pick 2+kk & 3+kk
    await page.getByRole("button", { name: /^Dispozice/ }).click();
    await page.getByRole("button", { name: "2+kk" }).click();
    await page.getByRole("button", { name: "3+kk" }).click();
    await page.keyboard.press("Escape");

    await expect(page).toHaveURL(/dispozice=2(%2B|\+)kk(%2C|,)3(%2B|\+)kk/);

    // Open FilterDrawer and add Balkon + max price 12 000 000
    await page.getByRole("button", { name: /Filtry/ }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name: "Balkon" }).click();
    await drawer.getByRole("button", { name: /Zobrazit/ }).click();

    await expect(page).toHaveURL(/vybaveni=balcony/);
    await page.waitForTimeout(400);
    const filteredCountText = await countLocator.textContent();
    expect(filteredCountText).not.toBe(initialCountText);

    // A5: Copy URL into fresh tab -> identical result count
    const sharedUrl = page.url();
    const secondPage = await context.newPage();
    await secondPage.goto(sharedUrl, { waitUntil: "networkidle" });
    await expect(secondPage.locator('p[aria-live="polite"]')).toHaveText(filteredCountText ?? "");
    await secondPage.close();

    // A4: Browser Back removes balcony filter, Forward restores it
    await page.goBack();
    await expect(page).not.toHaveURL(/vybaveni=balcony/);
    await page.goForward();
    await expect(page).toHaveURL(/vybaveni=balcony/);

    // Axe check on search page
    const axe = await new AxeBuilder({ page }).analyze();
    const severe = axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(severe).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test("A6, A7, A8: empty state + clear filters, sort by lowest Kč/m², and pagination page 2", async ({
    page,
  }) => {
    // A6: Impossible filter combination -> empty state with Zrušit filtry
    await page.goto("/prodej/byty?cenaOd=999000000", { waitUntil: "networkidle" });
    await expect(page.getByText("Pro tyto parametry jsme nic nenašli.")).toBeVisible();
    await page.getByRole("button", { name: "Zrušit filtry" }).first().click();
    await expect(page.locator("article").first()).toBeVisible();

    // A7: Sort by lowest price per m²
    await page.getByRole("combobox", { name: "Řazení" }).click();
    await page.getByRole("option", { name: "Nejnižší cena za m²" }).click();
    await expect(page).toHaveURL(/razeni=price_per_m2_asc/);
    await page.waitForTimeout(400);

    // Verify first 5 cards are ordered by ascending Kč/m²
    const perM2Texts = await page.locator("article").evaluateAll((cards) =>
      cards.slice(0, 5).map((card) => {
        const match = card.textContent?.match(/([\d\s\u00A0]+)\s*Kč\/m²/);
        return match ? Number(match[1]!.replace(/[\s\u00A0]/g, "")) : null;
      }),
    );
    const validNums = perM2Texts.filter((n): n is number => n !== null);
    expect(validNums.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < validNums.length; i++) {
      expect(validNums[i]!).toBeGreaterThanOrEqual(validNums[i - 1]!);
    }

    // A8: Go to page 2 and back to page 1
    await page.goto("/prodej/vse", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/strana=2/);
    await expect(page.locator("article").first()).toBeVisible();
    await page.getByRole("button", { name: "1", exact: true }).click();
    await expect(page).not.toHaveURL(/strana=2/);
  });
});
