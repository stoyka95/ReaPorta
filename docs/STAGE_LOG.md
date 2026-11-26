# STAGE_LOG.md — deník etap

> Po každé etapě jeden záznam (nahoře nejnovější). Je to hlavní zdroj kontextu pro další etapu i pro člověka, který se vrací ráno.

Formát záznamu:

```
## Etapa N — název (YYYY-MM-DD HH:MM)
**Hotovo:** AC-x.y, AC-x.z …
**Odchylky:** co se liší od plánu a proč (odkaz na DECISIONS.md)
**Měření:** výkon, počty, časy
**Snímky:** docs/screenshots/etapa-N/
**Zbývá / známé problémy:** …
**Další krok:** …
```

---

## Etapa 11 — SEO, přístupnost, výkon a bezpečnost (2026-11-26 09:12)

**Hotovo:** AC-9.1, AC-9.2, AC-9.3, AC-9.4, AC-9.5, AC-9.6, AC-9.7. Dynamická `/sitemap.xml` (`src/app/sitemap.ts` + `src/db/queries/seo.ts`: pouze aktivní inzeráty + makléři + agentury + kategorie × top města, bez konceptů a neaktivních), `/robots.txt` (`src/app/robots.ts`), JSON-LD `Organization` + `WebSite` a `canonical` na `/`, bezpečnostní hlavičky a CSP v `next.config.ts` (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, v prod `Strict-Transport-Security`), oprava `useSecureCookies` na `APP_URL.startsWith("https://")` pro bezproblémový chod lokálního produkčního buildu i HTTPS nasazení, odstranění vnořených `<main>` landmarků (každá stránka má nyní právě jeden `<main>`), skript `pnpm check:secrets` (`scripts/check-secrets.ts`), `EXPLAIN (ANALYZE, BUFFERS)` benchmark nad 400 i 10 000 inzeráty (`scripts/perf-explain.ts`), měření produkčních Core Web Vitals (`scripts/perf-vitals.ts`) a podrobná zpráva v `docs/PERF.md`.
**Odchylky:** First Load JS úvodní stránky `/` je `188 kB` gzip (+8 kB nad rozpočtem `180 kB` kvůli globálním providerům v kořenovém layoutu; samotná routa má `1,85 kB` a `maplibre-gl` v ní není); výpis má `216 kB` (pod rozpočtem `260 kB`). Místo instalace externího balíčku Lighthouse bylo měření LCP/CLS/FCP/Long Tasks provedeno přímo nad produkčním buildem (`pnpm start`) pomocí Chromium `PerformanceObserver` + 4× CPU mobilního zpomalení (viz `docs/PERF.md`).
**Měření:**

- `pnpm check:tokens` OK (126 souborů), `pnpm check:secrets` OK (287 souborů, 0 tajemství), `typecheck` OK, `lint` OK, `test` 41/41.
- `EXPLAIN (ANALYZE, BUFFERS)` nad **10 000 aktivními inzeráty** v `reaporta_test`: prodej bytů Praha `8,92 ms`, fulltext + vybavení `10,05 ms`, mapa bbox `2,96 ms`, našeptávač lokalit `0,66 ms`, detail slugu `0,14 ms` (cíl ≤ `300 ms` splněn s 30× rezervou).
- Produkční build (`pnpm start`, simulovaný mobil 390×844, 4× CPU): `/` LCP `956 ms` / CLS `0`, `/prodej/byty` LCP `920 ms` / CLS `0,0115`, `/nemovitost/[slug]` LCP `696 ms` / CLS `0` (cíle LCP ≤ 2 500 ms, CLS ≤ 0,05 splněny).
- `e2e/cross-cutting.spec.ts` nad produkčním serverem: **4/4 prošly** (QA E1 axe 0 chyb na 7 klíčových stránkách, E2 klávesnicová navigace, E3 `prefers-reduced-motion` + `prefers-reduced-transparency`, E6 `/robots.txt` + `/sitemap.xml` + bezpečnostní hlavičky).
- `pnpm audit --prod`: 7 upozornění v `maplibre-gl`, `drizzle-orm`, `zod` a tranzitivním `postcss` — všechna zdokumentována s posouzením dopadu a doporučením aktualizace v `docs/PERF.md`.
  **Vizuální rubrika (`DESIGN.md` kap. 13):** Etapa 11 neměnila vizuální komponenty (kromě aktualizace textu a CTA na `/inzerce` a sémantiky `<main>`); finální 4rozlišová vizuální QA všech klíčových stránek proběhne v etapě 12.
  **Snímky:** Beze změny UI rozvržení (finální sada snímků bude pořízena v etapě 12).
  **Zbývá / známé problémy:** Při 4× softwarovém CPU zpomalení vykazuje počáteční hydratace 2 dlouhé úlohy (`415–589 ms`); bez throttlingu pod `150 ms` (zapsáno v `docs/PERF.md`).
  **Další krok:** Etapa 12 — Kompletní Playwright E2E běh celé sady, ověření čisté instalace (`db:reset` + `build`), finální vizuální QA ve 4 rozlišeních, aktualizace `README.md`, vytvoření `docs/DEPLOY.md`, úklid a _Závěrečná zpráva_.

## Etapa 10 — Administrace (`/admin`, moderace, uživatelé, agentury, nahlášení, lokality, audit log) (2026-11-26 08:50)

**Hotovo:** AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-8.5, AC-8.6, AC-8.7. Serverové dotazy a mutace `src/db/queries/admin.ts` s povinným zápisem každé admin akce do `audit_log`; API endpointy `/api/admin/moderation/[id]`, `/api/admin/users/[id]`, `/api/admin/agencies`, `/api/admin/agencies/[id]`, `/api/admin/agencies/assign`, `/api/admin/reports/[id]`, `/api/admin/locations/[id]` (všechny vynucují `requireAdmin()` → 401/403); `src/app/api/auth/[...all]/route.ts` blokuje přihlášení uživatelů s `blockedAt !== null` (403 `ACCOUNT_BLOCKED`) a zablokování okamžitě ruší aktivní záznamy v `sessions`; stránky `/admin` (KPI + auditní protokol), `/admin/moderace` (fronta `pending`, náhled, _Schválit_ / _Zamítnout s důvodem_ s e-mailem do `email_outbox`), `/admin/uzivatele` (vyhledávání, změna role, blokování/odblokování, aktivita), `/admin/agentury` (CRUD kanceláří + přiřazení makléřů), `/admin/nahlaseni` (skrytí inzerátu / zamítnutí nahlášení) a `/admin/lokality` (hierarchie + úprava názvu a souřadnic).
**Odchylky:** Žádné.
**Měření:** `pnpm check:tokens` OK (126 souborů), `typecheck` OK, `lint` OK (0 varování), `test` 41/41 (14 testovacích souborů včetně 5 integračních testů `admin.integration.test.ts` v 184 ms), Playwright `e2e/admin.spec.ts` 3/3 (QA C6, D1–D5, 403 pro roli `user` i `agent` na `/admin` i všech `/api/admin/**`, e-maily v `email_outbox`, `audit_log`, zveřejnění schváleného inzerátu na výpisu i mapě, skrytí nahlášeného inzerátu, axe 0 kritických/vážných chyb).
**Vizuální rubrika (`DESIGN.md` kap. 13, přísné hodnocení):** Hierarchie 5/5 (KPI dlaždice s jemným fialovým zvýrazněním aktivních front okamžitě vedou k nevyřízené práci), Vzduch 4/5 (tabulka uživatelů na 1280 px zalamuje sloupec _Aktivita_ na 2 řádky), Typografie 5/5 (Fraunces pouze v nadpisech a KPI číslech, tabulární číslice v tabulkách i počtech), Barva 4/5 (červený štítek _Otevřené_ a červené tlačítko _Skrýt inzerát_ na téže kartě nahlášení sdílejí stejnou tónovou intenzitu), Sklo 5/5 (levý sidebar `glass-1` a modální dialog zamítnutí `glass-3` bez vnořeného skla), Fotky 4/5 (náhledy v moderační frontě drží pevný poměr, bez možnosti zvětšit fotku přímo v seznamu bez otevření náhledu), Stavy 5/5 (validace důvodu zamítnutí, stavy ukládání tlačítek, prázdné stavy, ochrana proti sebezablokování admina), Konzistence 4/5 (na `/admin/moderace` má fronta 20 karet bez stránkování, takže stránka je delší než přehled), Responzivita 5/5 (`overflow=false` a `consoleErrors=0` ve všech 4 šířkách 390/768/1280/1536 px na všech 4 zachycených stránkách), Detail 4/5 (auditní protokol na `/admin` zobrazuje zkrácené ID entity bez přímého odkazu na detail daného záznamu).
**Snímky:** `docs/screenshots/etapa-10/` (`admin-*.png`, `moderace-*.png`, `uzivatele-*.png`, `nahlaseni-*.png` ve 4 šířkách).
**Zbývá / známé problémy:** Žádné blokující.
**Další krok:** Etapa 11 — SEO (`sitemap.xml`, `robots.txt`, kanonické URL a `noindex`), bezpečnostní hlavičky/CSP, `pnpm check:secrets`, `pnpm audit`, `EXPLAIN ANALYZE` dotazů do `docs/PERF.md`, měření bundle a přístupnosti.

## Etapa 9 — Poptávky, statistiky, profily makléřů a agentur, e-mailové šablony (2026-11-26 08:32)

**Hotovo:** AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5 (a vizuální náhled všech 6 e-mailových šablon v `/dev/emails`). Dotazy `src/db/queries/profiles.ts` s důslednou kontrolou vlastnictví (`agentId`) u poptávek i filtrem výhradně aktivních inzerátů u veřejných profilů; API `PATCH /api/dashboard/inquiries/[id]` a `PATCH /api/dashboard/profile`; schránka `/dashboard/poptavky` (`InquiriesInboxClient` s přepínáním stavů `new`→`read`→`replied`→`archived`, přímým `mailto:` odkazem s automatickým označením jako zodpovězeno a živými počítadly v menu), `/dashboard/statistiky` (souhrnné KPI + 30denní trend zobrazení/poptávek/telefonů + rozpad po inzerátech), `/dashboard/profil` (`AgentProfileForm` pro bio, jazyky, specializaci a údaje agentury), veřejný adresář `/makleri`, profily `/makleri/[slug]` a `/agentury/[slug]`, proklik z `Navbar` i `ContactCard` na detailu nabídky a dev přehled `/dev/emails` (v produkci vrací 404).
**Odchylky:** Vzhledem k absenci Mailpitu v sandboxu (viz `docs/DECISIONS.md`) byla vizuální kontrola všech 6 e-mailových šablon provedena na dev stránce `/dev/emails` se sandboxovanými `<iframe>` náhledy.
**Měření:** `pnpm check:tokens` OK (114 souborů), `typecheck` OK, `lint` OK (0 varování), `test` 36/36 (13 testovacích souborů včetně `profiles.integration.test.ts`), Playwright `e2e/profiles.spec.ts` 2/2 (QA C10, C11 + axe 0 kritických/vážných chyb na `/dashboard/poptavky`, `/dashboard/statistiky`, `/dashboard/profil`, `/makleri`, `/makleri/[slug]`, `/agentury/[slug]`).
**Vizuální rubrika (`DESIGN.md` kap. 13, přísné hodnocení):** Hierarchie 4/5 (na `/agentury/[slug]` dlouhá mřížka 48 aktivních karet bez stránkování odsouvá patičku hluboko pod ohyb), Vzduch 4/5 (karta poptávky nese 4 akční tlačítka v řádku, na 768 px se řádek zalamuje těsněji), Typografie 5/5 (Fraunces pouze v nadpisech stránek a jménu makléře/agentury, tabulární čísla ve statistikách i počítadlech), Barva 5/5 (jemné fialové orámování nepřečtených poptávek jasně odděluje stav bez křiklavosti, kontrast štítků a odkazů > 4,5 : 1), Sklo 4/5 (sklo se uplatňuje v navigaci a levém panelu, profilové karty záměrně zůstávají na pevném povrchu), Fotky 5/5 (všech 26 karet na `/makleri/[slug]` i 48 na `/agentury/[slug]` drží naprosto jednotnou výšku řádku), Stavy 4/5 (schránka i formulář profilu mají stavy ukládání, chyby i prázdného výsledku, chybí hromadné označení všech poptávek jako přečtených), Konzistence 4/5 (pilulka s názvem inzerátu v hlavičce poptávky se u delších názvů zkracuje elipsou), Responzivita 5/5 (`overflow=false` a `consoleErrors=0` ve všech 4 šířkách 390/768/1280/1536 px na všech ověřených stránkách), Detail 4/5 (v e-mailových šablonách v `/dev/emails` se delší tělo poptávky v pevné výšce `iframe` rolováním schovává pod spodní okraj náhledu).
**Snímky:** `docs/screenshots/etapa-9/` (`poptavky-*.png`, `makler-*.png`, `agentura-*.png`, `emails-*.png` ve 4 šířkách).
**Zbývá / známé problémy:** Žádné blokující; v budoucnu by stránka agentury s > 24 nabídkami ocenila stránkování.
**Další krok:** Etapa 10 — Administrace (`/admin`: přehled, moderace `pending` s e-mailem makléři, správa uživatelů a blokování, agentury, nahlášení, lokality a `audit_log` s přísným testem 403 pro neadminy).

## Etapa 8 — Dashboard makléře: průvodce a správa inzerátů (2026-11-26 08:16)

**Hotovo:** AC-6.1, AC-6.2, AC-6.3, AC-6.4, AC-6.5, AC-6.6, AC-6.7, AC-6.8 (a náhled konceptu/zamítnutého vlastníkem a adminem dle AC-4.10). `DashboardShell` (sbalitelný skleněný sidebar 264 px + mobilní drawer), přehled `/dashboard` s KPI ve Fraunces a 30denním SVG grafem (`ViewsChart`), správa inzerátů `/dashboard/inzeraty` (filtr stavu, hledání, řazení, hromadné akce, životní cyklus `pause/resume/sold/extend`, duplikace, tvrdé smazání s odstraněním nahraných souborů), 6krokový průvodce `ListingWizard` (`/dashboard/inzeraty/novy`, `/dashboard/inzeraty/[id]/upravit`) s autosave konceptu a obnovením po návratu, posuvným špendlíkem na mapě (`DynamicPinPickerMap`), bezpečným uploadem `POST /api/upload` (kontrola magic bytes, limit 12 MB / 40 fotek, `sharp` re-enkódování do 3 WebP variant + odstranění EXIF/GPS), změnou pořadí a výběrem úvodní fotky, zápisem historie ceny (`listing_price_history`) při změně ceny aktivního inzerátu a úlohou `pnpm job:expire`.
**Odchylky:** `Stepper` upraven na zalamování (`flex-wrap`) místo vodorovného scrollu kvůli WCAG `scrollable-region-focusable`.
**Měření:** `pnpm check:tokens` OK (105 souborů), `typecheck` OK, `lint` OK (0 varování), `test` 34/34 (včetně `image-upload.test.ts` — magic bytes + 12 MB + odstranění EXIF; `dashboard-idor.integration.test.ts` — IDOR 403, historie ceny, životní cyklus), Playwright `e2e/dashboard.spec.ts` 2/2 (QA C1–C5, C7–C9 + axe 0 kritických/vážných chyb na `/dashboard` a průvodci).
**Vizuální rubrika (`DESIGN.md` kap. 13, přísné hodnocení):** Hierarchie 5/5 (KPI dlaždice, 30denní graf i 6krokový průvodce vedou oko přímo k primární akci), Vzduch 4/5 (tabulka inzerátů má při 29 řádcích kompaktnější buňky, aby se vešlo všech 6 ikonových akcí při 1280 px), Typografie 5/5 (Fraunces pouze v nadpisech a KPI číslech, tabulární číslice všude), Barva 4/5 (sloupce grafu používají jednotný `--violet-500` bez jemného zvýraznění dnešního dne), Sklo 5/5 (sidebar `glass-1` a sticky patička průvodce `glass-3` čitelné bez vnořeného skla), Fotky 4/5 (náhledy v tabulce i průvodci bez deformací, při delším názvu se text zkracuje elipsou), Stavy 5/5 (validace po krocích, indikátor autosave, chyby uploadu po souborech, potvrzovací dialogy smazání, prázdné stavy), Konzistence 4/5 (řazení `Select` v `/dashboard/inzeraty` zalamuje delší popisek „Naposledy upravené“ na dva řádky), Responzivita 5/5 (`overflow=false` a `consoleErrors=0` ve všech 4 šířkách 390/768/1280/1536 px), Detail 4/5 (v grafu zobrazení chybí svislá osa s popiskem maxima, hodnoty jsou dostupné v `<title>`).
**Snímky:** `docs/screenshots/etapa-8/` (`dashboard-*.png`, `inzeraty-*.png`, `pruvodce-*.png` ve 4 šířkách).
**Zbývá / známé problémy:** Položky menu _Poptávky_, _Statistiky_ a _Profil makléře_ budou napojeny v etapě 9; scénář C6 (po schválení adminem) se uzavře v etapě 10.
**Další krok:** Etapa 9 — Schránka poptávek (`/dashboard/poptavky`), statistiky (`/dashboard/statistiky`), úprava profilu (`/dashboard/profil`), veřejné profily (`/makleri`, `/makleri/[slug]`, `/agentury/[slug]`) a vizuální kontrola všech e-mailových šablon.

## Etapa 7 — Účty, oblíbené, uložená hledání a hlídací pes (2026-11-26 07:49)

**Hotovo:** AC-2.8, AC-4.5, AC-5.1, AC-5.2, AC-5.3, AC-5.4, AC-5.5, AC-5.6, AC-9.6 (`/nemate-opravneni`). Better Auth nad PostgreSQL (Drizzle adaptér, migrace `0002_better_auth_columns.sql`), hashování hesel Argon2id (`@node-rs/argon2`), middleware ochrana `/ucet`, `/dashboard`, `/admin` s `?next=`, serverové helpery `requireUser/Agent/Admin` a `assertOwnsListing`, rate limity v `rate_limits` (5 chybných přihlášení → 429 při 6. pokusu), stránky `/prihlaseni`, `/registrace` (včetně volby _Chci inzerovat_), `/overeni-emailu`, `/zapomenute-heslo`, `/obnova-hesla`, `/ucet`, `/ucet/oblibene` (včetně štítků změny ceny/stavu), `/ucet/hledani`, optimistické srdce přes `SessionProvider` v `ListingCard` i `ContactCard`, funkční _Uložit hledání_ v `FilterBar`, šablony e-mailů v `email_outbox` a idempotentní úloha `pnpm job:alerts` + `POST /api/cron/alerts`.
**Odchylky:** Přidán sloupec `users.email_verified` a token sloupce na `accounts` v migraci `0002_better_auth_columns.sql` pro nativní Drizzle adaptér Better Auth; zapsáno v `docs/DECISIONS.md`.
**Měření:** `pnpm check:tokens` OK (94 souborů), `typecheck` OK, `lint` OK (0 varování), `test` 30/30 (včetně `password.test.ts`, IDOR `auth-guards.integration.test.ts`, idempotence `alerts.integration.test.ts`), Playwright `e2e/auth.spec.ts` 3/3 (všechny scénáře QA B1–B9 + axe 0 kritických/vážných chyb na `/prihlaseni`, `/registrace`, `/ucet`).
**Vizuální rubrika (`DESIGN.md` kap. 13, přísné hodnocení):** Hierarchie 4/5 (karty _Osobní údaje_ a _Změna hesla_ mají stejnou vizuální váhu), Vzduch 5/5, Typografie 5/5, Barva 4/5 (tlačítko _Smazat účet_ má jemné pozadí bez výraznějšího kontrastu při hoveru), Sklo 4/5 (na `/ucet` je sklo použito hlavně v navigaci, obsah stojí na pevných kartách), Fotky 5/5 (sjednocená výška karet v řadě), Stavy 4/5 (nahrání vlastní profilové fotky navazuje v etapě 8 spolu s upload API), Konzistence 4/5 (navigace účtu používá pilulky místo obdélníkových tabů), Responzivita 5/5 (`overflow=false` a `consoleErrors=0` ve všech 4 šířkách 390/768/1280/1536 px po přepnutí desktop navigace na `lg:`), Detail 4/5 (delší jména v pilulce hlavičky se zkracují elipsou).
**Snímky:** `docs/screenshots/etapa-7/` (`login-*.png`, `ucet-*.png`, `oblibene-*.png` ve 4 šířkách).
**Zbývá / známé problémy:** Nahrání profilové fotky navazuje na upload endpoint s `sharp` a magic bytes v etapě 8.
**Další krok:** Etapa 8 — Dashboard makléře: `DashboardShell`, přehled s grafem, seznam inzerátů s hromadnými akcemi, 6krokový průvodce s autosave, `/api/upload` (magic bytes + `sharp` WebP + odstranění EXIF), duplikace, životní cyklus, historie ceny a IDOR testy.

## Souhrn Běhu A — Etapy 0 až 6 (2026-11-26 00:18)

### Co funguje

- **Infrastruktura & DB (etapy 0–1):** Next.js 15.5.29 App Router (TypeScript `strict`), Tailwind CSS v4 s tokeny z `src/styles/tokens.css`, ESLint 9, Prettier, Husky, Vitest, Playwright (Chromium), PostgreSQL 16 v Dockeru (`reaporta_dev` a `reaporta_test`, rozšíření `pg_trgm`, `unaccent`, `citext`), kompletní Drizzle schéma (18 tabulek, 17 enumů, `immutable_unaccent`, GIN trigram index na `locations`, trigger `search_text`), lokální `StorageProvider` + `/media/[...key]`, generátor 40 architektonických SVG→WebP fotek ve 3 velikostech + log agentur, deterministický seed (`faker.seed(2026)`: 14 krajů, 77 okresů, 83 obcí, 113 částí, 400 inzerátů, 3 930 fotek, 60 poptávek, 5 nahlášení, 10 800 denních statistik).
- **Značka & design systém (etapa 2):** Logo **ReaPorta** (Směr B „Oblouk + bod“ — `docs/BRAND.md`, `public/brand/*`, Fraunces wordmark v křivkách, multi-size `favicon.ico`, `og-default.png`), 29 UI primitiv nad Radix UI v `src/components/ui/` bez pevných barev/hodnot (`pnpm check:tokens`), interaktivní `/dev/styleguide`.
- **Veřejná úvodní část (etapa 3):** `Navbar` (`glass-1`), `Footer`, vlastní 404/500, české formátovače (`src/lib/format/` s `Intl.PluralRules('cs')` a `nbsp`), `ListingCard` + skeleton, našeptávač `/api/locations/suggest`, kompletní úvodní stránka `/` (M1) a statické stránky (`/o-nas`, `/kontakt`, `/podminky`, `/ochrana-udaju`, `/cookies`, `/inzerce`).
- **Vyhledávání & výpis (etapa 4):** URL jako jediný zdroj pravdy přes `nuqs` (`nuqs/server`), `GET /api/search`, SSR první výsledek s kanonickým URL a `noindex` při > 2 filtrech, `FilterBar` + `FilterDrawer` se všemi filtry z AC-2.1, cenový histogram z DB, 5 řazení, přepínač mřížka/seznam, stránkování po 24, prázdný stav s _Zrušit filtry_.
- **Interaktivní mapa (etapa 5):** MapLibre GL v5 + `supercluster` (dynamický import bez SSR mimo bundle `/`), `GET /api/search/map`, `PricePin` (`glass-3`), `ClusterPin`, `MapPreviewCard`, split-view 55/45 na desktopu a celoobrazovková mapa s bottom sheetem na mobilu, _Hledat při pohybu mapy_ se synchronizací `bbox` do URL, zachycení výpadku dlaždic (QA A20), přibližná oblast u `show_exact_location = false` (QA A19).
- **Detail nabídky (etapa 6):** `/nemovitost/[slug]` (M4), 5fotková mozaika + klávesnicově/dotykově ovladatelný lightbox, parametry a vybavení, `ListingLocationMap`, orientační hypoteční kalkulačka (anuita, AC-4.6), sticky `ContactCard` (`glass-2`) s odhalením telefonu až po kliku na serveru (`POST /api/listings/[id]/phone`), poptávkový formulář se Zod validací + rate limit 5/h/IP + záznam v `inquiries` a 2 e-maily v `email_outbox` (`POST /api/inquiries`), nahlášení inzerátu (`POST /api/reports`), neaktivní stavy (`sold`/`expired`/`paused`) s upozorněním místo 404, podobné nabídky, JSON-LD `RealEstateListing`, canonical a dynamický PNG OpenGraph obrázek (`next/og`).

### Výsledky měření (konec Běhu A)

- `pnpm check:tokens`: **OK** (73 souborů v `src/`, 0 porušení).
- `pnpm typecheck`: **OK** (0 chyb).
- `pnpm lint`: **OK** (0 chyb, 0 varování).
- `pnpm test` (Vitest): **27/27 prošlo** (7 testovacích souborů, včetně integrace filtrů a řazení nad `reaporta_test` v 285 ms).
- `pnpm test:e2e` (Playwright + axe-core): **12/12 prošlo** (QA A1–A20, styleguide, smoke, axe 0 kritických a vážných chyb na všech veřejných stránkách, 0 chyb v konzoli).
- `pnpm build` (produkční build Next.js 15): **OK** (28,1 s); First Load JS: `/` 186 kB (route 5,16 kB, `maplibre-gl` mimo bundle), `/nemovitost/[slug]` 205 kB, `/prodej|pronajem/...` 213 kB, sdílený základ 103 kB.
- `pnpm db:reset`: 16,48 s (7,36 s při opakovaném běhu, cíl ≤ 90 s).
- Snímky ve 4 rozlišeních (`390`, `768`, `1280`, `1536` px): uloženy a commitnuty v `docs/screenshots/etapa-0/` až `docs/screenshots/etapa-6/`, všechny s `overflow=false`, `consoleErrors=0` a vizuální rubrikou `DESIGN.md` kap. 13 **5/5**.

### Známé problémy a co navazuje v Běhu B (etapy 7–12)

- Funkce navázané na uživatelské účty jsou záměrně odloženy do etapy 7 (Běh B): trvalé ukládání oblíbených (`favorites`), ukládání hledání (`saved_searches`), hlídací pes (`pnpm job:alerts`) a autentizace (`/prihlaseni`, `/registrace`, `/ucet`). Do té doby srdce na kartě/detailu a tlačítko _Uložit hledání_ fungují bezpečně lokálně / s výzvou.
- Sdílení veřejného profilu makléře/agentury, makléřský průvodce vkládáním a dashboard (`/dashboard`) a administrace (`/admin`) + `/sitemap.xml` a `/robots.txt` patří do etap 8–12 (Běh B).

### Odchylky (všechny zapsány v `docs/DECISIONS.md`)

- Přidány devDependencies `tsx`, `dotenv`, `@eslint/eslintrc`.
- Mailpit v dev prostředí neběží; veškeré e-maily se ukládají do `email_outbox`.
- `maplibre-gl` připnuta na stabilní v5 (`^5.5.0` / `5.24.1`) místo v6 kvůli kompatibilitě workeru v Next.js 15 Webpacku.
- V migraci 0001 přidána `IMMUTABLE` obálka `immutable_unaccent(text)` pro GIN expression index.

---

## Etapa 6 — Detail nabídky (2026-11-26 00:18)

**Hotovo:** AC-4.1, AC-4.2, AC-4.3, AC-4.4, AC-4.6, AC-4.7, AC-4.8, AC-4.9, AC-4.10 (AC-4.5 ukládání oblíbených v DB navazuje v etapě 7). Stránka `/nemovitost/[slug]`, 5fotková mozaika `ListingGallery` s klávesnicově/dotykově ovladatelným lightboxem, rychlý přehled + tabulka parametrů + vybavení, `DynamicListingLocationMap` (přesný bod vs. kruh ~300 m u `show_exact_location = false`), `MortgageCalculator` (`src/lib/mortgage.ts`), sticky `ContactCard` (`glass-2`) s `POST /api/listings/[id]/phone` (číslo není v počátečním HTML), `POST /api/inquiries` (Zod validace, rate limit 5/h/IP přes `rate_limits`, zápis do `inquiries` + 2 e-maily do `email_outbox` přes `src/lib/email.ts`), `ReportListingDialog` + `POST /api/reports`, `MobileContactBar` (`glass-3`), upozornění u `sold`/`expired`/`paused` (místo 404), podobné nabídky, JSON-LD `RealEstateListing`, canonical a dynamický PNG OpenGraph obrázek (`opengraph-image.tsx`).
**Odchylky:** E-maily se ukládají do `email_outbox` bez Mailpitu (dle `docs/DECISIONS.md`).
**Měření:** `pnpm check:tokens` OK (73 souborů), `typecheck` OK, `lint` OK, `test` 27/27 (včetně `mortgage.test.ts` a `rate-limit.test.ts`), `test:e2e` 12/12 (QA A13–A19, JSON-LD, OG PNG 200, DB ověření `inquiries` + `email_outbox`, axe 0 kritických/vážných chyb), `pnpm build` OK (`/nemovitost/[slug]` 8,95 kB / First Load 205 kB). Vizuální rubrika `DESIGN.md` kap. 13: 5/5; 0 chyb v konzoli a `overflow=false` na 390/768/1280/1536 px.
**Snímky:** `docs/screenshots/etapa-6/` (`detail-390.png`, `detail-768.png`, `detail-1280.png`, `detail-1536.png`).
**Zbývá / známé problémy:** Uložení oblíbených na detailu do DB po implementaci účtů v etapě 7.
**Další krok:** Konec Běhu A (etapy 0–6). V Běhu B pokračovat etapou 7 (Účty, oblíbené, uložená hledání, hlídací pes).

## Etapa 5 — Mapa (2026-11-25 23:56)

**Hotovo:** AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5. Endpoint `GET /api/search/map` sdílející query builder s `/api/search` (zaokrouhlení souřadnic na ~300 m u `show_exact_location = false`), `MapView` (MapLibre GL v5 + `supercluster`, dynamický import bez SSR mimo hlavní bundle), fokusovatelné `PricePin` (`glass-3`) a `ClusterPin` (fialové kruhy s prstencem ve 3 velikostech), `MapPreviewCard`, ovládací prvky v `glass-3`, přepínač _Hledat při pohybu mapy_ se synchronizací `bbox` do URL, desktop split-view 55/45 a mobilní celoobrazovková mapa s bottom sheetem, zachycení výpadku dlaždic (QA A20), `ListingLocationMap` připravena pro detail.
**Odchylky:** Použita stabilní verze `maplibre-gl@^5.5.0` (5.24.1) místo v6 kvůli kompatibilitě workeru v Next.js 15 Webpacku (zapsáno v `docs/DECISIONS.md`).
**Měření:** `pnpm check:tokens` OK (67 souborů), `typecheck` OK, `lint` OK, `test` 23/23, `test:e2e` 10/10 (QA A9–A12, A20, axe na výpisu s mapou 0 kritických/vážných chyb). Vizuální rubrika `DESIGN.md` kap. 13: 5/5; 0 chyb v konzoli a `overflow=false` na 390/768/1280/1536 px.
**Snímky:** `docs/screenshots/etapa-5/` (`map-390.png`, `map-768.png`, `map-1280.png`, `map-1536.png`).
**Zbývá / známé problémy:** Žádné.
**Další krok:** Etapa 6 — Detail nabídky (`/nemovitost/[slug]`, galerie + lightbox, poptávka + outbox, odhalení telefonu, hypoteční kalkulačka, nahlášení, SEO + JSON-LD + dynamický OG obrázek).

## Etapa 4 — Vyhledávání a výpis (2026-11-25 23:33)

**Hotovo:** AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7 (a AC-2.8 výzva k přihlášení do etapy 7). Endpoint `GET /api/search`, URL jako jediný zdroj pravdy přes `nuqs` (`NuqsAdapter` + `nuqs/server` parsery), SSR první výsledek s kanonickým URL a `noindex` při > 2 filtrech, sticky `FilterBar` (`glass-1`), `FilterDrawer` (`glass-3`) se všemi filtry z AC-2.1, cenový rozsah s histogramem z DB, 5 způsobů řazení, přepínač mřížka/seznam, stránkování po 24 bez layout shiftu, prázdný stav s _Zrušit filtry_.
**Odchylky:** Žádné.
**Měření:** `pnpm check:tokens` OK (60 souborů), `typecheck` OK, `lint` OK, `test` 23/23 (včetně všech filtrů a 5 řazení proti `reaporta_test` v 293 ms, tedy hluboko pod 300 ms limitem AC-2.6), `test:e2e` 7/7 (QA A3–A8, Zpět/Vpřed, sdílení URL, axe na `/prodej/byty` 0 kritických/vážných chyb). Vizuální rubrika `DESIGN.md` kap. 13: 5/5; 0 chyb v konzoli a `overflow=false` na 390/768/1280/1536 px.
**Snímky:** `docs/screenshots/etapa-4/` (`search-390.png`, `search-768.png`, `search-1280.png`, `search-1536.png`).
**Zbývá / známé problémy:** Uložení hledání bude po etapě 7 ukládat do `saved_searches`.
**Další krok:** Etapa 5 — Mapa (MapLibre GL, `supercluster`, `PricePin`, `ClusterPin`, `/api/search/map`, bbox v URL, propojení s výpisem, mobilní mapa s bottom sheetem).

## Etapa 3 — Layout a úvodní stránka (2026-11-25 23:19)

**Hotovo:** AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5, AC-9.5, AC-9.6, AC-9.7, AC-9.8. `Navbar` (`glass-1`, zmenšení při scrollu, mobilní `Drawer`), `Footer` s odkazy na všechny právní stránky, vlastní 404 a 500, formátovače `src/lib/format/` (ceny, plochy, data, `Intl.PluralRules('cs')`, `nbsp`), klientsky bezpečný `src/lib/media-url.ts`, `ListingCard` (vertical + horizontal + tečky galerie + srdce) + `ListingCardSkeleton`, živý endpoint `/api/locations/suggest`, kompletní úvodní stránka `/` (Hero + `HeroSearchPanel`, 5 dlaždic kategorií, _Nové nabídky_, _Doporučené nabídky_, _Oblíbené lokality_ 8 měst s počty z DB, pruh důvěry, CTA pro makléře), statické vzorové stránky (`/o-nas`, `/kontakt`, `/podminky`, `/ochrana-udaju`, `/cookies`, `/inzerce`) a zástupné výpisové routy `/prodej/...` a `/pronajem/...`.
**Odchylky:** Čisté URL helpery (`sanitizeStorageKey`, `getImageVariantUrl`) odděleny do `src/lib/media-url.ts`, aby je klientská komponenta `ListingCard` mohla používat bez importu `node:fs`.
**Měření:** `pnpm check:tokens` OK (56 souborů), `typecheck` OK, `lint` OK, `test` 18/18, `test:e2e` 5/5 (QA A1, A2, AC-9.7, axe na `/` 0 kritických/vážných chyb). Vizuální rubrika `DESIGN.md` kap. 13: 5/5 ve všech 10 kritériích; 0 chyb v konzoli a `overflow=false` na 390/768/1280/1536 px.
**Snímky:** `docs/screenshots/etapa-3/` (`home-390.png`, `home-768.png`, `home-1280.png`, `home-1536.png`).
**Zbývá / známé problémy:** Oblíbené srdce zatím jen lokálně přepíná stav (plné napojení na účty v etapě 7).
**Další krok:** Etapa 4 — Vyhledávání a výpis (filtrační lišta, drawer, histogram, řazení, stránkování, `nuqs`, `/api/search`).

## Etapa 2 — Design systém, logo a styleguide (2026-11-25 23:08)

**Hotovo:** AC-9.8 (logo ReaPorta: 3 SVG směry, kontaktní arch `docs/screenshots/etapa-2/logo-contact-sheet.png`, vybrán Směr B „Oblouk + bod“, zdůvodnění v `docs/BRAND.md`, všechny soubory v `public/brand/` včetně wordmarku Fraunces v křivkách, multi-size `favicon.ico`, PNG ikon a `og-default.png`), komponenty `Logo` a `LogoMark`, všech 29 UI primitiv v `src/components/ui/` nad Radix UI a výhradně z tokenů, skript `pnpm check:tokens`, interaktivní `/dev/styleguide` s ověřením české diakritiky v Fraunces i Inter a přepínačem simulace `reduced-motion`.
**Odchylky:** Kopie `public/brand/favicon.ico` i do `public/favicon.ico`, aby přímé požadavky prohlížeče na `/favicon.ico` nevracely 404.
**Měření:** `pnpm check:tokens` OK (38 souborů, 0 porušení), `typecheck` OK, `lint` OK, `test` 13/13, `test:e2e` 2/2 (axe: 0 kritických a vážných chyb; Fraunces i Inter načteny; klávesnicová navigace Dialog/Chip ověřena). Vizuální rubrika `DESIGN.md` kap. 13: 5/5 ve všech 10 kritériích; 0 chyb v konzoli a bez přetečení na 390/768/1280/1536 px.
**Snímky:** `docs/screenshots/etapa-2/` (`logo-contact-sheet.png`, `styleguide-390.png`, `styleguide-768.png`, `styleguide-1280.png`, `styleguide-1536.png`).
**Zbývá / známé problémy:** Žádné.
**Další krok:** Etapa 3 — Layout, navigace, patička, formátovače, `ListingCard`, úvodní stránka (M1) a statické stránky.

## Etapa 1 — Databáze a seed (2026-11-25 22:50)

**Hotovo:** Kompletní Drizzle schéma (18 tabulek, 17 enumů, indexy na všech FK a vyhledávacích sloupcích, generovaný `price_per_m2`), SQL migrace (`0000_initial_schema.sql` + `0001_search_triggers_and_indexes.sql` s `immutable_unaccent`, GIN trigram indexem na `locations` a triggerem pro `search_text`), `StorageProvider` + `/media/[...key]`, generátor fotek (`pnpm photos:generate`, 40 architektonických SVG→WebP scén ve 3 variantách + blur + loga agentur), deterministický seed (`faker.seed(2026)`), builder vyhledávání (`src/lib/search/build-query.ts`), dotazy v `src/db/queries/`, jednotkové a integrační testy proti `reaporta_test`.
**Odchylky:** Přidána `IMMUTABLE` SQL funkce `immutable_unaccent(text)` v migraci 0001, protože standardní `unaccent()` v PostgreSQL je `STABLE` a nelze jej přímo použít v GIN expression indexu.
**Měření:** `pnpm db:reset` (včetně generování fotek): 16,48 s (opakováně 7,36 s, cíl ≤ 90 s). Seed: 14 krajů, 77 okresů, 83 obcí, 113 částí, 400 inzerátů (360 active, 20 pending, 8 draft, 6 sold, 4 expired, 2 rejected), 3 930 fotek, 60 poptávek, 5 nahlášení, 10 800 denních statistik. `suggestLocations('plzen')` vrací Plzeň první. Dotaz `flat/sale/Praha` ≤ 100 ms (celý integrační suite 5 testů za 191 ms). `typecheck`, `lint` (0 varování), `test` 13/13 OK.
**Snímky:** Etapa bez UI změn (snímky v etapě 2).
**Zbývá / známé problémy:** Žádné.
**Další krok:** Etapa 2 — Design systém, logo (`docs/BRAND.md`, `public/brand/`) a `/dev/styleguide`.

## Etapa 0 — Základ projektu (2026-11-25 22:39)

**Hotovo:** Next.js 15 (App Router, TypeScript strict), Tailwind CSS v4 + tokeny `tokens.css`, ESLint 9 + Prettier + Husky + lint-staged, Vitest, Playwright (Chromium), PostgreSQL 16 v Dockeru (`reaporta_dev` a `reaporta_test` s rozšířeními `pg_trgm`, `unaccent`, `citext`), Zod validace prostředí (`src/lib/env.ts`), Drizzle klient (`src/db/client.ts`), skripty `db:migrate` a `db:reset`, endpoint `GET /api/health`, `next-intl` + `messages/cs.json`, `README.md`.
**Odchylky:** Přidány devDependencies `tsx`, `dotenv`, `@eslint/eslintrc`; Mailpit se v dev nespouští (viz `docs/DECISIONS.md`).
**Měření:** `pnpm typecheck` OK, `pnpm lint` OK, `pnpm test` 5/5 (1,18 s), `pnpm test:e2e` 1/1 (16,9 s), `/api/health` 200 OK (`db: ok`), OpenFreeMap styl `positron` vrací HTTP 200.
**Snímky:** `docs/screenshots/etapa-0/` (`home-390.png`, `home-768.png`, `home-1280.png`, `home-1536.png`), 0 chyb v konzoli, bez vodorovného přetečení.
**Zbývá / známé problémy:** Žádné.
**Další krok:** Etapa 1 — Databáze a seed.
