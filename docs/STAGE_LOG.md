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
