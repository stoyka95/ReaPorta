import { test, expect } from "@playwright/test";

test("smoke: /api/health returns ok and home page renders without console errors", async ({
  page,
  request,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const body = (await health.json()) as { status: string; db: string };
  expect(body.status).toBe("ok");
  expect(body.db).toBe("ok");

  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
