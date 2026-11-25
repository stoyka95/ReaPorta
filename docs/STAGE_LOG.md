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
