# ReaPorta

Realitní portál (MVP) pro prodej a pronájem nemovitostí: vyhledávání s filtry a mapou, detail nabídky, účty, dashboard makléře a administrace. Česky, lokálně nad PostgreSQL, ve světlém skleněném designu s jednou fialovou akcentní barvou.

Tento repozitář je **zadání pro AI agenta** (Google Antigravity). Obsahuje kompletní specifikaci, architekturu, plán po etapách, design systém a připravené prompty. Kód aplikace vznikne během práce agenta.

## Rychlý start (člověk)

1. Nainstaluj Antigravity a otevři tuto složku jako workspace.
2. Nainstaluj Node.js 22, pnpm a PostgreSQL 16+ (nebo `docker compose up -d`, viz `docker-compose.yml`).
3. `cp .env.example .env` a uprav `DATABASE_URL`.
4. V Agent Manageru vytvoř agenta ve workspace a vlož prompt z **`prompts/01-RUN-A.md`**.
5. Po dokončení běhu A zkontroluj výsledek (checklist je na konci promptu), pak spusť **`prompts/02-RUN-B.md`**.
6. Vzhled se nelíbí? Uprav `DESIGN.md` a použij **`prompts/03-design-review.md`**.

## Mapa dokumentace

| Soubor | Obsah |
|---|---|
| [`AGENTS.md`](AGENTS.md) · [`GEMINI.md`](GEMINI.md) | pravidla, která Antigravity načítá vždy |
| [`DESIGN.md`](DESIGN.md) | design systém: barvy, písma, sklo, komponenty, stránky, QA rubrika |
| [`docs/SPEC.md`](docs/SPEC.md) | co se staví: moduly a akceptační kritéria (AC) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | stack, schéma DB, routy, vyhledávání, bezpečnost, testy |
| [`docs/PLAN.md`](docs/PLAN.md) | 13 etap (0–12) ve dvou bězích, "Hotovo když" |
| [`docs/SEED-DATA.md`](docs/SEED-DATA.md) | smyšlená testovací data (~400 inzerátů) |
| [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md) | scénáře pro ověření v prohlížeči |
| [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) | předem zodpovězená rozhodnutí a místo pro nové otázky |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) · [`docs/STAGE_LOG.md`](docs/STAGE_LOG.md) | rozhodnutí a deník etap (vyplňuje agent) |
| [`docs/MODELS.md`](docs/MODELS.md) | který model a effort v Antigravity zvolit pro kterou etapu |
| [`prompts/`](prompts) | úvodní prompty pro oba běhy, revizi designu a krizové situace |
| [`.agents/`](.agents) | pravidla (`rules/`) a zkratky (`workflows/`) pro Antigravity |

## Zvolené parametry

- **Styl:** světlé sklo (glass) + jemné přechody
- **Barvy:** neutrální šedá + jedna fialová (`#6D3FE0`)
- **Písma:** Fraunces (nadpisy) + Inter (text)
- **Rozsah:** plné MVP (veřejný web, účty, dashboard makléře, admin)
- **Stack:** Next.js, PostgreSQL (lokálně), Drizzle, Better Auth, Tailwind v4, MapLibre

## Poznámky

- Název **ReaPorta** = *Rea* (reality) + *porta* (latinsky brána, dveře). Logo navrhne agent v etapě 2 podle `DESIGN.md` kap. 15.
- Všechna data a texty v seedu jsou smyšlené. Aplikace nekopíruje žádný existující portál.
- Co je mimo rozsah (platby, import, chat, tmavý režim, nasazení) je v `docs/SPEC.md` kap. 3.
