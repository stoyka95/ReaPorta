# AGENTS.md — pravidla pro AI agenta (Antigravity a další)

Stavíš **ReaPorta** (*Rea* + *porta* = brána), český realitní portál (MVP), lokálně nad PostgreSQL. Tento soubor se načítá vždy. Je krátký záměrně; podrobnosti jsou v dokumentech níže.

## Pořadí čtení (vždy na začátku práce)

1. `docs/STAGE_LOG.md`: kde jsme skončili.
2. `docs/PLAN.md`: aktuální etapa a její "Hotovo když".
3. `docs/SPEC.md`: akceptační kritéria (AC) dané etapy.
4. `docs/ARCHITECTURE.md`: stack, schéma, routy, bezpečnost. **Rozhodnutí tam jsou závazná.**
5. `DESIGN.md`: vzhled. **Každé UI se řídí jen tímto souborem.**
6. `docs/SEED-DATA.md`, `docs/QA-CHECKLIST.md`: data a ověřování.
7. `docs/OPEN-QUESTIONS.md`: co už je rozhodnuto (neptej se znovu).

## Jak pracovat

- Pracuj **po etapách** podle `docs/PLAN.md`, žádnou nepřeskakuj a neslučuj. Před každou etapou napiš krátký plán (soubory, kroky, rizika) a pokračuj bez čekání.
- **Autonomně.** Když nastane nejasnost, kterou dokumentace nevyřeší, zapiš ji do `docs/OPEN-QUESTIONS.md` s výchozí variantou a pokračuj. Nezastavuj se kvůli otázkám, které nemění směr projektu.
- Malé kroky, po každém `pnpm typecheck && pnpm lint`. Nezanechávej rozbitý build.
- Po etapě: testy, ověření v prohlížeči (viz `docs/QA-CHECKLIST.md`), snímky UI ve 4 rozlišeních, commit `etapa N: popis (AC-…)`, záznam do `docs/STAGE_LOG.md`.
- **Nikdy netvrď, že něco funguje, pokud jsi to nespustil.** Výsledek testu nebo snímek je důkaz; úsudek ne.

## Tvrdá pravidla

**Design**
- Žádné hex barvy, žádné pevné velikosti písma, mezery, poloměry ani stíny v komponentách. Pouze tokeny z `src/styles/tokens.css` / Tailwind theme. Chybí-li token, přidej ho do `tokens.css` a zdůvodni v commitu.
- Barvy, písma a sklo přesně dle `DESIGN.md`. Nevymýšlej vlastní paletu ani jiná písma. Žádné modré výchozí barvy Tailwindu.
- Každá nová kombinace barev textu a pozadí: spočítej kontrast (≥ 4,5 : 1).
- Každá komponenta má stavy: hover, focus-visible, disabled, loading, chyba, prázdný.

**Kód**
- TypeScript `strict`, žádné `any`, žádné `@ts-ignore` bez komentáře a zápisu do `DECISIONS.md`.
- Validace všech vstupů Zod schématy (klient i server). Dotazy do DB jen přes `src/db/queries` a Drizzle; **žádné SQL z řetězců s uživatelským vstupem**.
- Oprávnění vždy na serveru (`requireUser/Agent/Admin`, `assertOwnsListing`), middleware je jen první vrstva.
- Texty UI jen v `messages/cs.json`, česky, vykání.
- Žádné nové závislosti bez zápisu do `docs/DECISIONS.md` (co, proč, alternativy).

**Data a obsah**
- Žádná reálná data, texty, obrázky ani inzeráty z cizích portálů. Žádný scraping. Seed je smyšlený.
- Žádná tajemství v repozitáři. `.env` se necommituje.

**Zakázáno**
- Nasazovat, publikovat, posílat skutečné e-maily, platit, volat placené API.
- `git push --force`, mazání historie, `drop database` mimo DB s `dev` nebo `test` v názvu.
- Měnit `DESIGN.md`, `SPEC.md` a `ARCHITECTURE.md` bez zápisu do `DECISIONS.md` (jen zpřesnit, nepřepisovat záměr).

## Použití Antigravity

- **Artifacts:** před každou etapou Implementation Plan, po etapě Walkthrough se snímky a výsledky testů. Do snímků dávej jména `docs/screenshots/etapa-N/<stránka>-<šířka>.png`.
- **Prohlížeč:** po každé UI změně projdi scénáře z `docs/QA-CHECKLIST.md` v prohlížeči. Vizuální rubrika z `DESIGN.md` kap. 13 je povinná.
- **Workflows** (`/start-stage`, `/browser-qa`, `/design-review`, `/stage-report`) v `.agents/workflows/` jsou zkratky pro opakované postupy. Použij je.
- **Více agentů:** paralelně smí běžet jen úkoly, které se nedotýkají stejných souborů (např. testy vs. nová stránka). Schéma DB a `tokens.css` mění vždy jen jeden agent.

## Příkazy

```
pnpm dev                 vývojový server
pnpm typecheck           tsc --noEmit
pnpm lint                ESLint
pnpm test                Vitest
pnpm test:e2e            Playwright
pnpm db:migrate | db:seed | db:reset
pnpm photos:generate     generované fotky pro seed
pnpm job:alerts          e-maily s upozorněním na nové nabídky
pnpm check:tokens        kontrola, že komponenty nepoužívají pevné hodnoty
```

## Definice hotovo (pro každou etapu)

Splněno "Hotovo když" z `PLAN.md` · zelené `typecheck`, `lint`, `test` · UI ověřeno v prohlížeči a ve 4 rozlišeních · vizuální rubrika ≥ 4/5 · žádné chyby v konzoli · commit · záznam v `STAGE_LOG.md`.
