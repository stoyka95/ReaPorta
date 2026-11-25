# PLAN.md — plán po etapách

> Pracuje se **etapu po etapě**. Etapa je hotová teprve tehdy, když splní svoji "Definici hotovo". Pak commit, zápis do `docs/STAGE_LOG.md` a teprve potom další etapa.

## Dva běhy

| Běh | Etapy | Výsledek | Odhad |
|---|---|---|---|
| **Běh A — Veřejná část** | 0–6 | funguje vyhledávání s mapou a detail nabídky nad seedovanými daty, celé v novém designu | 3–4 h |
| **Běh B — Aplikace** | 7–12 | účty, dashboard makléře, admin, SEO, testy, polish | 3–5 h |

Mezi běhy je kontrolní bod pro člověka (prohlédne si výsledek, případně upraví `DESIGN.md` a `SPEC.md`). Prompty: `prompts/01-RUN-A.md`, `prompts/02-RUN-B.md`.

## Společný postup pro každou etapu

1. Přečti související části `SPEC.md`, `ARCHITECTURE.md`, `DESIGN.md` a poslední záznam `STAGE_LOG.md`.
2. Napiš **Implementation Plan** (krátký artefakt): soubory, kroky, rizika. Pokračuj bez čekání na schválení, pokud nejde o změnu rozhodnutí v `ARCHITECTURE.md`.
3. Implementuj po malých krocích. Po každém logickém kroku `pnpm typecheck && pnpm lint`.
4. Ověř: testy, aplikace v prohlížeči (agent s prohlížečem projde scénáře dané etapy), snímky ve 4 rozlišeních u UI.
5. Opravy. Opakuj 4, dokud není vše splněno.
6. Commit ve formátu `etapa N: stručný popis (AC-x.y, AC-x.z)`, zápis do `STAGE_LOG.md` (co je hotovo, odchylky, co zbývá, čísla výkonu).
7. Otevřené otázky zapisuj do `docs/OPEN-QUESTIONS.md` s tím, co jsi zvolil jako výchozí, a **jdi dál**.

---

## Etapa 0 — Základ projektu
**Cíl:** prázdná, ale zdravá aplikace s celým nástrojovým řetězcem.
- Inicializace Next.js (TypeScript strict, App Router, `src/`), pnpm, Tailwind v4, ESLint, Prettier, Husky + lint-staged, Vitest, Playwright (jen konfigurace + 1 smoke test).
- Zkopíruj `.env.example` → `.env`; `src/lib/env.ts` s validací proměnných (Zod, selže při startu s jasnou hláškou).
- Připojení k PostgreSQL (`src/db/client.ts`), skript `db:*`, `docker-compose.yml` zkontroluj a doplň.
- `GET /api/health` (ověří DB).
- Základní `README.md` (jak spustit za 5 minut).
**Hotovo když:** `pnpm install && pnpm db:migrate && pnpm dev` běží; `pnpm typecheck`, `pnpm lint`, `pnpm test` projdou; `/api/health` vrací `ok`; smoke test v Playwrightu projde.

## Etapa 1 — Databáze a seed
**Cíl:** celé schéma a realistická testovací data.
- Drizzle schéma dle `ARCHITECTURE.md` kap. 4 včetně indexů, triggeru pro `search_text`, rozšíření (`CREATE EXTENSION IF NOT EXISTS pg_trgm, unaccent, citext`).
- Migrace, `db:reset`, pojistka proti běhu na špatné DB.
- Seed dle `docs/SEED-DATA.md` (lokality, uživatelé, agentury, makléři, ~400 inzerátů, fotky vygenerované skriptem `photos:generate`).
- Dotazovací funkce v `src/db/queries` (základ: `getListingBySlug`, `searchListings`, `suggestLocations`).
- Jednotkové a integrační testy schématu a dotazů.
**Hotovo když:** `pnpm db:reset` vytvoří DB do 90 s; počty v DB odpovídají `SEED-DATA.md`; `suggestLocations('plzen')` vrací Plzeň první; test výkonu: hledání `flat/sale/Praha` nad seedem ≤ 100 ms.

## Etapa 2 — Design systém a styleguide
**Cíl:** všechny primitivní komponenty podle `DESIGN.md`, ověřené vizuálně.
- `tokens.css`, `globals.css` (Tailwind `@theme`), fonty (Fraunces, Inter; latin-ext), `.page-aurora`, `.glass-1/2/3`.
- Komponenty (`src/components/ui`): Button, IconButton, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider (rozsah), Chip, SegmentedControl, Tabs, Badge, Avatar, Card, GlassPanel, Dialog, Drawer, Popover, Tooltip, Toast, Skeleton, Pagination, Breadcrumbs, EmptyState, Spinner, Stepper, Dropzone (UI), Table.
- **Logo a značka** podle `DESIGN.md` kap. 15: tři SVG směry, kontaktní arch, výběr se zdůvodněním v `docs/BRAND.md`, všechny soubory v `public/brand/`, komponenty `Logo` a `LogoMark`, favicon a ikony.
- `/dev/styleguide`: všechny komponenty a jejich stavy, logo ve všech variantách a na všech pozadích, barvy, typografie, test české diakritiky, přepínač simulace `reduced-motion`.
- Skript `pnpm check:tokens` selže, pokud v `src/**/*.tsx|css` (mimo `tokens.css`) najde hex barvu nebo `px` hodnotu v inline stylu/klasickém CSS mimo povolené výjimky.
**Hotovo když:** logo existuje ve všech souborech z `DESIGN.md` kap. 15 a čte se při 16 px; styleguide v 4 rozlišeních splňuje rubriku z `DESIGN.md` kap. 13 (≥ 4/5 všude); axe bez kritických chyb; `check:tokens` projde; klávesnicí lze projít každou interaktivní komponentu.

## Etapa 3 — Layout a úvodní stránka
**Cíl:** navigace, patička, úvod.
- `Navbar` (glass-1, zmenšení po scrollu, mobilní menu jako drawer), `Footer`, stránky 404/500.
- Úvodní stránka M1 (AC-1.1 až 1.5) napojená na DB, hero s vyhledávacím panelem, `ListingCard` (s variantami), skeleton.
- Formátovače `src/lib/format` (cena, plocha, datum, plurál) + testy.
- `messages/cs.json` pro všechny texty.
- Statické stránky O nás, Kontakt, Podmínky, Ochrana údajů, Cookies (ukázkový text označený jako vzorový) a odkazy na ně v patičce (AC-9.7).
**Hotovo když:** AC-1.x splněna, vyhledání z hero vede na výpis (zatím jen routa se zástupným obsahem), vizuální rubrika ≥ 4/5, LCP ≤ 2,5 s na úvodu.

## Etapa 4 — Vyhledávání a výpis
**Cíl:** plnohodnotný výpis s filtry bez mapy.
- Builder dotazu, endpointy `/api/search`, `/api/locations/suggest`, stránky `/prodej/...` a `/pronajem/...` (server rendering prvního výsledku, URL jako zdroj pravdy přes `nuqs`).
- Filtrační lišta, drawer *Další filtry*, rozsah ceny s histogramem, řazení, stránkování, prázdný stav, uložení hledání (zatím vyvolá přihlášení, po etapě 7 funkční).
- Vitest: každý filtr; Playwright: nastavení filtrů, Zpět, sdílení URL.
**Hotovo když:** AC-2.1 až 2.7 splněna; měření: hledání nad seedem ≤ 300 ms; žádný layout shift při změně filtru.

## Etapa 5 — Mapa
**Cíl:** mapa propojená s výpisem.
- `MapView` (MapLibre), `PricePin`, `ClusterPin`, shlukování, bbox filtr v URL, propojení hover/klik s kartami, mobilní celoobrazovková varianta s bottom sheetem, ovládací prvky v glass.
- `/api/search/map`. Zaokrouhlená poloha u `show_exact_location = false`.
- Zachycení chybějících tiles (hláška + výpis dál funguje).
**Hotovo když:** AC-3.1 až 3.5; plynulé (bez znatelného sekání) pohyby mapy se 400 body; Playwright test: pohyb mapy změní výpis a URL.

## Etapa 6 — Detail nabídky
**Cíl:** detail podle `DESIGN.md` kap. 7 (zatím bez funkčních účtů).
- Galerie + lightbox, klíčová fakta, parametry, vybavení, mapa polohy, hypoteční kalkulačka, podobné nabídky, kontaktní karta, formulář poptávky (ukládá do DB a outboxu), odhalení telefonu, nahlášení, SEO a JSON-LD, neaktivní inzeráty.
- Dynamický OG obrázek.
**Hotovo když:** AC-4.1 až 4.4, 4.6 až 4.10 (4.5 po etapě 7); poptávka vytvoří záznam i e-mail v Mailpitu/outboxu; axe bez kritických chyb; CLS ≤ 0,05.

> **Konec běhu A.** Napiš shrnutí do `STAGE_LOG.md` a zastav se. Člověk zkontroluje výsledek.

---

## Etapa 7 — Účty, oblíbené, uložená hledání
- Better Auth, registrace/přihlášení/ověření e-mailu/reset hesla, middleware, helpery oprávnění, rate limity.
- `/ucet`, `/ucet/oblibene`, `/ucet/hledani`; oblíbené srdce napříč aplikací (optimistická aktualizace); uložení hledání; `job:alerts`.
**Hotovo když:** AC-4.5, AC-2.8, AC-5.1 až 5.6; e-mail s upozorněním dorazí do Mailpitu a podruhé se nepošle stejná nabídka.

## Etapa 8 — Dashboard makléře: průvodce a správa inzerátů
- `DashboardShell`, přehled, seznam inzerátů, průvodce (6 kroků, autosave), adresa + mapa, upload fotek s pořadím, zpracování `sharp`, náhled, odeslání do moderace, úprava, duplikace, životní cyklus, historie ceny.
**Hotovo když:** AC-6.1 až 6.8; makléř vloží inzerát od nuly přes UI, vidí ho po schválení na veřejném webu; test IDOR projde.

## Etapa 9 — Poptávky, profily, e-maily
- Schránka poptávek, statistiky, veřejné profily makléřů a agentur, `/makleri`, úprava profilu, všechny e-mailové šablony.
**Hotovo když:** AC-7.1 až 7.5; šablony e-mailů vizuálně zkontrolovány v Mailpitu.

## Etapa 10 — Administrace
- Admin přehled, moderace, uživatelé, agentury, nahlášení, lokality, audit log.
**Hotovo když:** AC-8.1 až 8.7; neadmin dostane 403 na všech `/admin` routách i server actions (test).

## Etapa 11 — SEO, přístupnost, výkon, bezpečnost
- Sitemap (stránkované), robots, kanonické URL a `noindex` pravidla, JSON-LD, meta všude.
- Audit přístupnosti (axe na všech klíčových stránkách, ruční kontrola klávesnice, kontrast nových kombinací).
- Výkon: `EXPLAIN ANALYZE` hlavních dotazů do `docs/PERF.md`, doplnění indexů, bundle analýza, rozpočty z `ARCHITECTURE.md`.
- Bezpečnost: hlavičky/CSP, `pnpm audit`, kontrola tajemství, přehled rate limitů, kontrola uploadu.
**Hotovo když:** AC-9.1 až 9.7; všechny rozpočty splněny nebo odchylka zdůvodněna v `STAGE_LOG.md`.

## Etapa 12 — E2E, finální QA a polish
- Playwright pokrývá všechny scénáře z `QA-CHECKLIST.md`.
- Finální vizuální QA všech stránek ve 4 rozlišeních podle `DESIGN.md` kap. 13, opravy.
- Dokumentace: `README.md` (spuštění, skripty, účty ze seedu, architektura v kostce), `docs/DEPLOY.md` (jak by se nasadilo; nic nenasazovat).
- Úklid: mrtvý kód, TODO, nepoužité závislosti.
**Hotovo když:** `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e` zelené; `QA-CHECKLIST.md` celé odškrtnuté; zápis *Závěrečná zpráva* v `STAGE_LOG.md`.
