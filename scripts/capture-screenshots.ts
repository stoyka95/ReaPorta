import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1536", width: 1536, height: 960 },
] as const;

interface Target {
  name: string;
  url: string;
  fullPage?: boolean;
  waitMs?: number;
}

async function main(): Promise<void> {
  const stage = process.argv[2];
  const targetsArg = process.argv.slice(3);

  if (!stage || targetsArg.length === 0) {
    console.error(
      "Použití: tsx scripts/capture-screenshots.ts <etapa-N> <name=path> [name2=path2 ...]",
    );
    process.exit(1);
  }

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const outDir = path.resolve(process.cwd(), "docs/screenshots", stage);
  fs.mkdirSync(outDir, { recursive: true });

  const targets: Target[] = targetsArg.map((entry) => {
    const eqIndex = entry.indexOf("=");
    if (eqIndex === -1) {
      throw new Error(`Neplatný formát cíle: ${entry} (očekává se name=/cesta)`);
    }
    return {
      name: entry.slice(0, eqIndex),
      url: entry.slice(eqIndex + 1),
      fullPage: true,
    };
  });

  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        locale: "cs-CZ",
      });
      const page = await context.newPage();

      for (const target of targets) {
        const errors: string[] = [];
        const onConsole = (msg: { type: () => string; text: () => string }) => {
          if (msg.type() === "error") errors.push(msg.text());
        };
        page.on("console", onConsole);

        const fullUrl = `${baseUrl}${target.url}`;
        await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 30_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(target.waitMs ?? 300);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );

        const filePath = path.join(outDir, `${target.name}-${vp.name}.png`);
        await page.screenshot({ path: filePath, fullPage: target.fullPage ?? true });

        page.off("console", onConsole);
        console.log(
          `[${stage}] ${target.name}-${vp.name}.png | overflow=${overflow} | consoleErrors=${errors.length}`,
        );
        if (errors.length > 0) {
          console.error("  Console errors:", errors);
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Chyba při pořizování snímků:", err);
  process.exit(1);
});
