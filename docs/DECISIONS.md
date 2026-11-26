# DECISIONS.md — technická rozhodnutí a odchylky

> Zapisuj sem každou odchylku od `ARCHITECTURE.md` (jiná knihovna, jiná verze, změna schématu) a každou novou závislost. Jeden záznam = 3 řádky.

Formát:

```
## YYYY-MM-DD · Etapa N · Název rozhodnutí
Kontext: proč to vzniklo.
Rozhodnutí: co se zvolilo (a co se zamítlo).
Důsledek: co to mění.
```

---

## 2026-11-25 · Etapa 0 · Přidání `tsx`, `dotenv` a `@eslint/eslintrc` do devDependencies

Kontext: Spouštění TypeScript skriptů (`db:migrate`, `db:reset`, `db:seed`, `check:tokens`) a konfigurace ESLint 9 flat config s `eslint-config-next`.
Rozhodnutí: Přidány devDependencies `tsx`, `dotenv` a `@eslint/eslintrc`; zamítnuto spouštění skriptů přes kompilovaný JS výstup nebo `ts-node`.
Důsledek: Skripty v `scripts/*.ts` běží přímo přes `pnpm` bez dalšího build kroku a ESLint 9 korektně načítá Next.js pravidla.

## 2026-11-25 · Etapa 0 · E-maily v dev prostředí bez Mailpitu

Kontext: Zadání pro běh v sandboxu zakazuje použití Mailpitu; `docker-compose.yml` jej ponechává jen jako volitelnou službu.
Rozhodnutí: V dev prostředí běží pouze kontejner `db` (PostgreSQL 16) a odchozí e-maily se ukládají výhradně do tabulky `email_outbox`.
Důsledek: Ověřování e-mailů v testech a QA probíhá nad tabulkou `email_outbox` místo SMTP UI Mailpitu.

## 2026-11-25 · Etapa 5 · Použití `maplibre-gl` v5 místo v6

Kontext: `maplibre-gl@6` vyžaduje externí ESM worker (`maplibre-gl-worker.mjs`), což v Next.js 15 Webpack bundleru způsobovalo chybu načtení workeru v konzoli.
Rozhodnutí: Připnuta stabilní verze `maplibre-gl@^5.5.0` (5.24.1) s vestavěným workerem; v6 zamítnuta pro nekompatibilitu s výchozím Next.js bundlerem.
Důsledek: Mapa renderuje vektorové dlaždice bez chyb v konzoli a bez ručního kopírování worker souborů do `public/`.

## 2026-11-26 · Etapa 7 · Better Auth + `@node-rs/argon2` a sloupec `users.email_verified`

Kontext: Better Auth Drizzle adaptér vyžaduje boolean `email_verified` na `users` a doplňkové token sloupce na `accounts`; AC-5.6 vyžaduje hashování hesel přes Argon2id.
Rozhodnutí: Přidány knihovny `better-auth` a `@node-rs/argon2` (explicitně dle `ARCHITECTURE.md`) a migrace `0002_better_auth_columns.sql` se synchronizací `email_verified` ↔ `email_verified_at`.
Důsledek: Session jsou uloženy v PostgreSQL, hesla používají Argon2id a blokovaní/smazaní uživatelé jsou odmítnuti při přihlášení i na každém serverovém dotazu.
