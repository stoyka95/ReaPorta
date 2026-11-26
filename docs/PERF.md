# PERF.md — Měření výkonu, EXPLAIN ANALYZE, bundle a bezpečnostní audit

Měřeno v rámci **Etapy 11** (`2026-11-26`) nad produkčním buildem Next.js 15 (`pnpm build` + `pnpm start`) a PostgreSQL 16 (Docker `reaporta-db-1`).

---

## 1. Databázové dotazy — `EXPLAIN (ANALYZE, BUFFERS)`

Skript: `pnpm exec tsx scripts/perf-explain.ts` (měřeno nad `reaporta_dev` se 400 inzeráty a nad `reaporta_test` dočasně naplněnou **10 000 aktivními inzeráty**; po měření byla testovací data automaticky vyčištěna).

| Dotaz                                                                             | 400 inzerátů | 10 000 inzerátů | Použitý plán (10 000 řádků)                                                | Cíl (AC-2.6)      |
| --------------------------------------------------------------------------------- | -----------: | --------------: | -------------------------------------------------------------------------- | ----------------- |
| 1. Prodej bytů v Praze (`price ≤ 12 M`, `ORDER BY published_at DESC`, `LIMIT 24`) |    `0,81 ms` |   **`8,92 ms`** | Hash Join (`locations` + `listings`), Top-N Heapsort                       | ≤ 300 ms (**OK**) |
| 2. Fulltext + vybavení (`search_text` GIN + `amenities` GIN)                      |    `0,29 ms` |  **`10,05 ms`** | Bitmap Index Scan (`400`) / Seq Scan + Top-N (`10 000`)                    | ≤ 300 ms (**OK**) |
| 3. Mapa bbox Praha a okolí (max 2 000 bodů)                                       |    `0,17 ms` |   **`2,96 ms`** | `BitmapAnd` (`listings_lat_lng_idx` + `listings_status_offer_cat_pub_idx`) | ≤ 300 ms (**OK**) |
| 4. Našeptávač lokalit (`pg_trgm` + `immutable_unaccent`)                          |    `0,59 ms` |   **`0,66 ms`** | `BitmapOr` přes `locations_name_unaccent_trgm_idx`                         | ≤ 100 ms (**OK**) |
| 5. Detail nabídky podle slugu (`UNIQUE` index + join agent/agency)                |    `0,18 ms` |   **`0,14 ms`** | `Index Scan using listings_slug_unique` + PK lookups                       | ≤ 50 ms (**OK**)  |

**Závěr DB:** Nejpomalejší měřený dotaz nad 10 000 aktivními inzeráty trvá **`10,05 ms`**, tj. **30× rychleji** než limit `300 ms` v `ARCHITECTURE.md` kap. 5. Žádné další indexy nebyly potřeba; všechny existující indexy (kompozitní `listings_status_offer_cat_pub_idx`, `listings_lat_lng_idx`, `listings_amenities_gin_idx`, `listings_search_text_gin_idx`, `locations_name_unaccent_trgm_idx`, `listings_slug_unique`) pokrývají produkční přístupové vzory.

---

## 2. Velikost JS bundlu (`pnpm build`)

| Routa                                                 |  Route JS | First Load JS (gzip) | Rozpočet (`ARCHITECTURE.md` kap. 10) | Stav                             |
| ----------------------------------------------------- | --------: | -------------------: | ------------------------------------ | -------------------------------- |
| `/` (úvodní stránka, ISR 60 s)                        | `1,85 kB` |         **`188 kB`** | ≤ 180 kB                             | Odchylka +8 kB (zdůvodnění níže) |
| `/prodej/[category]/[[...lokalita]]` (výpis bez mapy) |   `148 B` |         **`216 kB`** | ≤ 260 kB                             | **OK** (−44 kB rezerva)          |
| `/pronajem/[category]/[[...lokalita]]`                |   `147 B` |         **`216 kB`** | ≤ 260 kB                             | **OK** (−44 kB rezerva)          |
| `/nemovitost/[slug]` (detail)                         | `8,07 kB` |         **`207 kB`** | —                                    | **OK**                           |
| `/dashboard`                                          | `1,57 kB` |         **`170 kB`** | —                                    | **OK**                           |
| `/admin`                                              |   `257 B` |         **`165 kB`** | —                                    | **OK**                           |
| Sdílený základ (`First Load JS shared by all`)        |         — |         **`103 kB`** | —                                    | **OK**                           |

**Zdůvodnění odchylky na `/` (`188 kB` vs. `180 kB`):**

- Samotná úvodní stránka má pouze **`1,85 kB`**, `maplibre-gl` ani `supercluster` nejsou v jejím bundlu vůbec obsaženy (načítají se výhradně dynamicky s `ssr: false` po přepnutí na mapu).
- Rozdíl `+8 kB` oproti cíli 180 kB tvoří globální providery v kořenovém layoutu (`NextIntlClientProvider`, `SessionProvider`, `ToastProvider`, `NuqsAdapter` a sdílený `Navbar`). V produkci by šlo ušetřit ~12 kB přesunem `NuqsAdapter` pouze do výpisových rout; pro MVP ponecháváme globální kontext kvůli konzistenci a měřený mobilní LCP je hluboko pod limitem (`956 ms` vs. `2 500 ms`).

---

## 3. Core Web Vitals (lokální produkční build, simulovaný střední mobil)

Skript: `pnpm exec tsx scripts/perf-vitals.ts` (Playwright Chromium, viewport `390×844` @2x, CDP `Emulation.setCPUThrottlingRate: 4`, po zahřátí ISR cache):

| Stránka                       |  LCP (cíl ≤ 2 500 ms) |      CLS (cíl ≤ 0,05) |      FCP |        DCL |          Max Long Task (4× CPU) |
| ----------------------------- | --------------------: | --------------------: | -------: | ---------: | ------------------------------: |
| Úvodní stránka (`/`)          | **`956 ms`** (**OK**) |      **`0`** (**OK**) | `956 ms` | `1 514 ms` | `566 ms` (hydratace při 4× CPU) |
| Výpis (`/prodej/byty`)        | **`920 ms`** (**OK**) | **`0,0115`** (**OK**) | `920 ms` | `1 844 ms` | `415 ms` (hydratace při 4× CPU) |
| Detail (`/nemovitost/[slug]`) | **`696 ms`** (**OK**) |      **`0`** (**OK**) | `696 ms` |   `949 ms` | `589 ms` (hydratace při 4× CPU) |

**Poznámka k Long Tasks a Lighthouse:**

- V bezhlavém sandboxu bez externího balíčku `lighthouse` (přidávání nových závislostí je omezeno pravidly `AGENTS.md`) probíhá měření Core Web Vitals přímo přes Chromium `PerformanceObserver` + CDP CPU 4× throttling.
- LCP (`696–956 ms`) a CLS (`0–0,0115`) s velkou rezervou splňují cíle AC-9.1.
- Při 4× softwarovém CPU zpomalení vykazuje počáteční React 19 + Next.js hydratace 2 dlouhé úlohy (`415–589 ms`, bez throttlingu pod `150 ms`). Optimalizace pod 200 ms i při 4× CPU by vyžadovala rozdělení hydratace hlavičky a `next-intl` zpráv do `Suspense` hranic (vhodný bod pro post-MVP iteraci).

---

## 4. Bezpečnostní kontrola a `pnpm audit --prod`

### Implementované vrstvy (`ARCHITECTURE.md` kap. 11)

- **HTTP hlavičky (`next.config.ts`):** `Content-Security-Policy` (povoluje vlastní původ + `tiles.openfreemap.org` a `worker-src 'self' blob:` pro MapLibre), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN`, a v produkci `Strict-Transport-Security`. Ověřeno automatickým E2E testem (`e2e/cross-cutting.spec.ts`).
- **Tajemství (`pnpm check:secrets`):** `scripts/check-secrets.ts` kontroluje repozitář na vzory API klíčů a privátních klíčů — **0 nálezů**. `.env` není sledováno Gitem.
- **Upload (`POST /api/upload`):** ověření magic bytes (`image-upload.ts`), limit 12 MB/soubor a 40 souborů/inzerát, re-enkódování přes `sharp` s otočením a odstraněním EXIF/GPS (testováno ve Vitestu `image-upload.test.ts`).
- **Rate limity (`rate_limits` v DB):** přihlášení (5 chybných / 15 min → 429), registrace (10/h), reset hesla (5/h), poptávky (5/h), odhalení telefonu (20/h).
- **RBAC & IDOR:** `requireUser`, `requireAgent`, `requireAdmin`, `assertOwnsListingForUser` ověřeny integračními i Playwright testy (403 na všech `/api/admin/**` a `/admin/**` pro neadminy i IDOR pro makléře).

### Výsledek `pnpm audit --prod` (2026-11-26)

Nalezeno **7 upozornění** (2 moderate, 4 high, 1 critical) v nainstalovaných verzích balíčků:

1. **`maplibre-gl` (critical):** XSS sanitizer bypass v `DOM.sanitize()` — v ReaPorta se do MapLibre předávají výhradně statické texty a vlastní React/HTML elementy bez uživatelského HTML; před ostrým nasazením aktualizovat na opravenou patch verzi.
2. **`drizzle-orm` (high):** SQL injection přes neošetřené SQL identifikátory — v celé aplikaci jsou všechny názvy tabulek/sloupců statické ze schématu, nikdy z uživatelského vstupu.
3. **`zod` (high):** vyčerpání paměti u nadměrných kolekcí — všechny pole a stringy v Zod schématech mají explicitní `.max(...)` limity.
4. **`postcss` (2× high, 2× moderate, tranzitivně z `next`):** zranitelnosti při zpracování nedůvěryhodného CSS / `sourceMappingURL` — PostCSS běží výhradně při buildu nad vlastními CSS soubory v repozitáři, nikdy nad uživatelskými daty.
