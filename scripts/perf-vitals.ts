import { chromium } from "@playwright/test";

interface PageMetrics {
  name: string;
  url: string;
  lcpMs: number;
  cls: number;
  fcpMs: number;
  dclMs: number;
  maxLongTaskMs: number;
  longTaskCount: number;
}

async function measureUrl(
  browser: import("@playwright/test").Browser,
  baseUrl: string,
  name: string,
  urlPath: string,
): Promise<PageMetrics> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "cs-CZ",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  // Simulace středního mobilu dle AC-9.1 (4× zpomalení CPU)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.addInitScript(() => {
    const win = window as unknown as {
      __perf: { lcp: number; cls: number; fcp: number; longTasks: number[] };
    };
    win.__perf = { lcp: 0, cls: 0, fcp: 0, longTasks: [] };

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.startTime > win.__perf.lcp) win.__perf.lcp = entry.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // ignore
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        >) {
          if (!entry.hadRecentInput && typeof entry.value === "number") {
            win.__perf.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // ignore
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            win.__perf.fcp = entry.startTime;
          }
        }
      }).observe({ type: "paint", buffered: true });
    } catch {
      // ignore
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          win.__perf.longTasks.push(entry.duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // ignore
    }
  });

  await page.goto(`${baseUrl}${urlPath}`, { waitUntil: "load", timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);

  const metrics = await page.evaluate(() => {
    const win = window as unknown as {
      __perf: { lcp: number; cls: number; fcp: number; longTasks: number[] };
    };
    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const maxLongTaskMs = win.__perf.longTasks.reduce((m, v) => Math.max(m, v), 0);
    return {
      lcpMs: Math.round(win.__perf.lcp),
      cls: Number(win.__perf.cls.toFixed(4)),
      fcpMs: Math.round(win.__perf.fcp),
      dclMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      maxLongTaskMs: Math.round(maxLongTaskMs),
      longTaskCount: win.__perf.longTasks.filter((d) => d > 200).length,
    };
  });

  await context.close();
  return { name, url: urlPath, ...metrics };
}

async function main(): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  // Zjistit platný slug prvního aktivního inzerátu
  const searchRes = await fetch(`${baseUrl}/api/search?offerType=sale&category=flat`);
  const searchJson = (await searchRes.json()) as { items?: Array<{ slug: string }> };
  const detailSlug = searchJson.items?.[0]?.slug;
  if (!detailSlug) {
    throw new Error("Nepodařilo se najít aktivní inzerát pro měření detailu.");
  }

  const browser = await chromium.launch();
  try {
    // Zahřívací požadavky (ISR cache warm-up)
    await fetch(`${baseUrl}/`);
    await fetch(`${baseUrl}/prodej/byty`);
    await fetch(`${baseUrl}/nemovitost/${detailSlug}`);

    const targets = [
      { name: "Úvodní stránka (/)", url: "/" },
      { name: "Výpis (/prodej/byty)", url: "/prodej/byty" },
      { name: "Detail (/nemovitost/[slug])", url: `/nemovitost/${detailSlug}` },
    ];

    const rows: PageMetrics[] = [];
    for (const t of targets) {
      const m = await measureUrl(browser, baseUrl, t.name, t.url);
      rows.push(m);
      console.log(
        `[PERF] ${m.name} | LCP=${m.lcpMs} ms | CLS=${m.cls} | FCP=${m.fcpMs} ms | DCL=${m.dclMs} ms | maxLongTask=${m.maxLongTaskMs} ms (>200ms: ${m.longTaskCount})`,
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
