# ReaPorta

**ReaPorta** (_Rea_ + _porta_ = brána) je český realitní portál (MVP) pro prodej a pronájem nemovitostí: vyhledávání s filtry a interaktivní mapou, detail nabídky s galerií a hypoteční kalkulačkou, uživatelské účty s oblíbenými a hlídacím psem, makléřský dashboard s 6krokovým průvodcem a kompletní administrace s moderací a auditním protokolem.

Navrženo ve světlém skleněném designu (_liquid glass_) s jediným fialovým akcentem (`DESIGN.md`), bez externích placených služeb, lokálně nad PostgreSQL 16.

---

## Spuštění za 5 minut

### Požadavky

- **Node.js 22 LTS** + **`pnpm`**
- **PostgreSQL 16+** (lokálně nebo přes Docker: `docker compose up -d db`)

### Postup z čistého prostředí

```bash
# 1. Nainstalujte závislosti
pnpm install

# 2. Spusťte lokální PostgreSQL 16 (pokud ji nemáte nainstalovanou přímo)
docker compose up -d db

# 3. Vytvořte konfigurační soubor .env
cp .env.example .env
# Upravte DATABASE_URL a vygenerujte tajemství (openssl rand -base64 32) pro BETTER_AUTH_SECRET

# 4. Připravte databázi: migrace, generované fotografie a deterministický seed (~10 s)
pnpm db:reset

# 5. Spusťte vývojový server
pnpm dev
```

Aplikace běží na `http://localhost:3000`. Zdravotní stav připojení k DB ověříte na `http://localhost:3000/api/health`.

---

## Přihlašovací údaje ze seedu

Všechny ukázkové účty (vygenerované deterministicky pomocí `faker.seed(2026)`) jsou ověřené a mají společné testovací heslo **`Heslo12345!`**:

| Role                | E-mail                   | Heslo         | Přístup                                                                           |
| ------------------- | ------------------------ | ------------- | --------------------------------------------------------------------------------- |
| **Správce (admin)** | `admin@reaporta.test`    | `Heslo12345!` | `/admin` (moderace, uživatelé, agentury, nahlášení, lokality, audit log)          |
| **Makléř (agent)**  | `makler@reaporta.test`   | `Heslo12345!` | `/dashboard` (přehled, inzeráty, 6krokový průvodce, poptávky, statistiky, profil) |
| **Uživatel (user)** | `uzivatel@reaporta.test` | `Heslo12345!` | `/ucet` (oblíbené, uložená hledání, hlídací pes, profil)                          |

> **Poznámka k e-mailům:** V lokálním prostředí se veškeré odchozí e-maily (ověření, obnova hesla, poptávky, výsledek moderace, hlídací pes) ukládají do databázové tabulky `email_outbox` — žádný skutečný e-mail neodchází. Vizuální náhled všech 6 e-mailových šablon je v dev režimu dostupný na `/dev/emails`.

---

## Dostupné příkazy

| Příkaz                 | Popis                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`             | Vývojový server Next.js                                                |
| `pnpm build`           | Produkční build Next.js                                                |
| `pnpm start`           | Spuštění produkčního buildu                                            |
| `pnpm typecheck`       | Kontrola typů (`tsc --noEmit`, `strict`)                               |
| `pnpm lint`            | ESLint                                                                 |
| `pnpm test`            | Jednotkové a integrační testy (Vitest proti `reaporta_test`)           |
| `pnpm test:e2e`        | E2E a přístupnostní testy (Playwright + `@axe-core/playwright`)        |
| `pnpm db:generate`     | Vygenerování SQL migrace z Drizzle schématu                            |
| `pnpm db:migrate`      | Aplikace migrací na `DATABASE_URL`                                     |
| `pnpm db:seed`         | Naplnění testovacích dat (14 krajů, 77 okresů, 83 obcí, 400 inzerátů)  |
| `pnpm db:reset`        | Reset dev/test DB + migrace + generování fotek + seed                  |
| `pnpm photos:generate` | Generování ukázkových architektonických SVG→WebP fotografií            |
| `pnpm job:alerts`      | Spuštění idempotentního hlídacího psa pro uložená hledání              |
| `pnpm job:expire`      | Označení inzerátů po termínu expirace (`expires_at`)                   |
| `pnpm check:tokens`    | Ověření, že komponenty nepoužívají pevné hex barvy ani magické hodnoty |
| `pnpm check:secrets`   | Kontrola repozitáře na výskyt nechtěných tajemství/klíčů               |

---

## Architektura v kostce

- **Framework:** Next.js 15 App Router, React 19, TypeScript `strict`, `next-intl` (čeština, vykání v `messages/cs.json`).
- **Design systém:** Tailwind CSS v4 + design tokeny v `src/styles/tokens.css` (Fraunces pro nadpisy a KPI, Inter pro UI a tabulární ceny, 3 úrovně skla `.glass-1` až `.glass-3`, 29 UI primitiv nad Radix UI v `src/components/ui/`).
- **Databáze:** PostgreSQL 16 + Drizzle ORM (`src/db/schema.ts`, 18 tabulek, 17 enumů, rozšíření `pg_trgm`, `unaccent`, `citext`, trigramový GIN index lokalit, `tsvector` fulltext + trigger). Veškeré dotazy jsou izolovány v `src/db/queries/`.
- **Vyhledávání a mapa:** URL jako jediný zdroj pravdy (`nuqs`), společný query builder (`src/lib/search/build-query.ts`) pro výpis i mapu, MapLibre GL v5 + `supercluster` načítaný dynamicky bez SSR mimo bundle úvodní stránky.
- **Autentizace a bezpečnost:** Better Auth s Argon2id (`@node-rs/argon2`), middleware + striktní serverové kontroly (`requireUser`, `requireAgent`, `requireAdmin`, `assertOwnsListingForUser`), databázové rate limity (`rate_limits`), upload fotografií s kontrolou magic bytes a `sharp` re-enkódováním (odstranění EXIF/GPS + 3 WebP varianty), CSP a bezpečnostní hlavičky v `next.config.ts`.
- **Úložiště médií:** Abstrakce `StorageProvider` (`src/lib/storage/`) s lokálním zápisem do `storage/` a servírováním přes `/media/[...key]` (připraveno k záměně za S3/R2).

---

## Dokumentace projektu

| Dokument                                                                            | Obsah                                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`DESIGN.md`](DESIGN.md) · [`docs/BRAND.md`](docs/BRAND.md)                         | Vizuální jazyk, tokeny, logo ReaPorta a rubrika kvality                       |
| [`docs/SPEC.md`](docs/SPEC.md)                                                      | Produktová specifikace a akceptační kritéria (AC-1 až AC-9)                   |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                                      | Technické řešení, DB schéma, routy a bezpečnostní opatření                    |
| [`docs/PERF.md`](docs/PERF.md)                                                      | `EXPLAIN ANALYZE` (400 i 10 000 řádků), bundle, Core Web Vitals, `pnpm audit` |
| [`docs/DEPLOY.md`](docs/DEPLOY.md)                                                  | Návod a checklist pro případné produkční nasazení                             |
| [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md)                                      | Kompletní QA scénáře A1–E13                                                   |
| [`docs/STAGE_LOG.md`](docs/STAGE_LOG.md) · [`docs/DECISIONS.md`](docs/DECISIONS.md) | Deník etap, závěrečná zpráva a záznam rozhodnutí                              |
