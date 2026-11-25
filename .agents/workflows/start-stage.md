---
description: Zahájí a provede jednu etapu podle docs/PLAN.md včetně ověření a commitu
---

Použití: `/start-stage <číslo etapy>`

1. Přečti `docs/STAGE_LOG.md`, v `docs/PLAN.md` najdi zadanou etapu a její "Hotovo když", v `docs/SPEC.md` související AC, a relevantní části `docs/ARCHITECTURE.md` a `DESIGN.md`.
2. Ověř základ: `pnpm typecheck && pnpm lint && pnpm test`. Pokud selhává, oprav to nejdřív.
3. Vytvoř artefakt Implementation Plan (soubory, kroky, rizika, které AC pokrývá). Nečekej na schválení.
4. Implementuj po malých krocích. Po každém kroku `pnpm typecheck && pnpm lint`.
5. Napiš nebo doplň testy (Vitest pro logiku, Playwright pro tok).
6. Spusť `/browser-qa` pro scénáře dané etapy z `docs/QA-CHECKLIST.md`.
7. Pokud etapa mění UI, spusť `/design-review`.
8. Opravuj a opakuj 6–7, dokud není splněno celé "Hotovo když".
9. Spusť `/stage-report`.
