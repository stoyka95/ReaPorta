import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("styleguide: axe zero critical/serious violations, fonts loaded, keyboard accessible", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/dev/styleguide", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // Verify Czech diacritics text renders
  await expect(page.getByText("Příliš žluťoučký kůň úpěl ďábelské ódy.").first()).toBeVisible();

  // Verify Fraunces and Inter fonts are loaded
  const loadedFonts = await page.evaluate(() => {
    const names = new Set<string>();
    document.fonts.forEach((f) => {
      if (f.status === "loaded") names.add(f.family.replace(/['"]/g, ""));
    });
    return Array.from(names);
  });
  expect(loadedFonts.some((f) => /fraunces/i.test(f))).toBe(true);
  expect(loadedFonts.some((f) => /inter/i.test(f))).toBe(true);

  // Keyboard test: open dialog via button, close with Escape
  const dialogBtn = page.getByRole("button", { name: "Otevřít dialog" });
  await dialogBtn.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  // Keyboard test: toggle Chip with Space
  const chip = page.getByRole("button", { name: "1+kk" });
  await chip.focus();
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(chip).toHaveAttribute("aria-pressed", "true");

  // Run axe accessibility audit
  const results = await new AxeBuilder({ page }).analyze();
  const severe = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(severe).toEqual([]);

  expect(consoleErrors).toEqual([]);
});
