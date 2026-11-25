# Pravidla pro databázi

- Jediný zdroj schématu: `src/db/schema.ts` (Drizzle). Změny jen přes migrace (`pnpm db:generate` → kontrola SQL → `pnpm db:migrate`). Migrace se po vytvoření **needitují**; oprava = nová migrace.
- Lokální PostgreSQL 16+. Povolená rozšíření: `pg_trgm`, `unaccent`, `citext`. PostGIS nepoužívat.
- Pojistka: `db:reset` a seed odmítnou běžet, pokud název databáze neobsahuje `dev` nebo `test`.
- Primární klíče `uuid` (kromě `locations`), časy `timestamptz`, peníze `numeric` (nikdy float), plochy `numeric`.
- Každý cizí klíč má index. Každý filtr použitý ve vyhledávání má index nebo zdůvodnění v `docs/PERF.md`.
- Žádné skládání SQL z řetězců s uživatelským vstupem. `sql.raw` jen s konstantami.
- Vyhledávání staví jediný builder (`src/lib/search/build-query.ts`); výpis, mapa, uložená hledání i upozornění ho sdílejí.
- Hrubé mazání jen u inzerátů (včetně souborů); `users` mají soft delete (`deleted_at`) a anonymizaci.
- Po změně schématu: aktualizuj seed, typy, testy a `docs/ARCHITECTURE.md` kap. 4.
- Nikdy nespouštěj `DROP`, `TRUNCATE` ani `db:reset` bez kontroly názvu databáze.
- Nastavení výkonu: u hlavních dotazů ulož `EXPLAIN ANALYZE` do `docs/PERF.md` (etapa 11).
