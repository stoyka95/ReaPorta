# ReaPorta

Realitní portál (MVP) pro prodej a pronájem nemovitostí: vyhledávání s filtry a mapou, detail nabídky, účty, dashboard makléře a administrace. Česky, lokálně nad PostgreSQL, ve světlém skleněném designu s jednou fialovou akcentní barvou.

## Spuštění za 5 minut

### Požadavky

- Node.js 22 LTS + `pnpm`
- PostgreSQL 16+ lokálně nebo Docker (`docker compose up -d db`)

### Postup

```bash
# 1. Nainstaluj závislosti
pnpm install

# 2. Spusť lokální PostgreSQL (pokud ji nemáš nainstalovanou přímo)
docker compose up -d db

# 3. Nastav prostředí
cp .env.example .env
# Uprav DATABASE_URL a vygeneruj BETTER_AUTH_SECRET (openssl rand -base64 32)

# 4. Aplikuj migrace (a od etapy 1 naplň seed data pomocí pnpm db:reset)
pnpm db:migrate

# 5. Spusť vývojový server
pnpm dev
```

Aplikace běží na `http://localhost:3000`. Stav připojení k databázi ověříš na `http://localhost:3000/api/health`.

## Užitečné příkazy

| Příkaz                 | Popis                                       |
| ---------------------- | ------------------------------------------- |
| `pnpm dev`             | vývojový server Next.js                     |
| `pnpm typecheck`       | kontrola typů (`tsc --noEmit`)              |
| `pnpm lint`            | ESLint                                      |
| `pnpm test`            | jednotkové a integrační testy (Vitest)      |
| `pnpm test:e2e`        | E2E testy (Playwright)                      |
| `pnpm db:generate`     | vygenerování SQL migrace z Drizzle schématu |
| `pnpm db:migrate`      | aplikace migrací na `DATABASE_URL`          |
| `pnpm db:seed`         | naplnění testovacích dat                    |
| `pnpm db:reset`        | vymazání dev/test DB + migrace + seed       |
| `pnpm photos:generate` | vygenerování ukázkových fotek pro seed      |
| `pnpm check:tokens`    | kontrola design tokenů v komponentách       |

## Dokumentace

| Soubor                                                                              | Obsah                             |
| ----------------------------------------------------------------------------------- | --------------------------------- |
| [`AGENTS.md`](AGENTS.md) · [`GEMINI.md`](GEMINI.md)                                 | pravidla pro AI agenta            |
| [`DESIGN.md`](DESIGN.md)                                                            | design systém a logo              |
| [`docs/SPEC.md`](docs/SPEC.md)                                                      | produktová specifikace a AC       |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                                      | technické řešení a DB schéma      |
| [`docs/PLAN.md`](docs/PLAN.md)                                                      | plán po etapách (0–12)            |
| [`docs/SEED-DATA.md`](docs/SEED-DATA.md)                                            | smyšlená testovací data           |
| [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md)                                      | scénáře ověření v prohlížeči      |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) · [`docs/STAGE_LOG.md`](docs/STAGE_LOG.md) | technická rozhodnutí a deník etap |
