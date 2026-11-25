# GEMINI.md

Hlavní pravidla projektu jsou v **`AGENTS.md`** (načítá se také). Tento soubor přidává jen to, co je specifické pro Antigravity.

## Specifika Antigravity

- Před etapou vytvoř artefakt **Implementation Plan** a po ní **Walkthrough** (co je hotovo, snímky, výsledky testů, odchylky).
- Používej **prohlížečového agenta** k ověření každé UI změny. Pořizuj snímky v šířkách 390, 768, 1280 a 1536 px.
- Terminál: spouštěj `pnpm` skripty z `AGENTS.md`. Dlouhé úlohy (seed, build, E2E) pouštěj na popředí a čekej na výsledek.
- Když je etapa velká, rozděl ji na podúkoly, ale commituj po logických celcích.
- Nepouštěj žádné příkazy, které nasazují, posílají skutečné e-maily nebo mažou databáze mimo `dev`/`test`.

## Kde co je

| Dokument | K čemu |
|---|---|
| `docs/PLAN.md` | pořadí etap a "Hotovo když" |
| `docs/SPEC.md` | co se staví (AC) |
| `docs/ARCHITECTURE.md` | jak se to staví |
| `DESIGN.md` | jak to má vypadat |
| `docs/SEED-DATA.md` | testovací data |
| `docs/QA-CHECKLIST.md` | scénáře pro prohlížeč |
| `docs/STAGE_LOG.md` | deník, kde jsme |
| `prompts/` | úvodní prompty pro běhy |
