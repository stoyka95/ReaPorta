---
description: Projde v prohlížeči scénáře z docs/QA-CHECKLIST.md pro aktuální etapu a odškrtne výsledek
---

1. Zjisti aktuální etapu ze `docs/STAGE_LOG.md`.
2. Ujisti se, že běží databáze (`pnpm db:reset`, pokud je potřeba čistý seed), dev server a Mailpit (nebo se používá `email_outbox`).
3. Z `docs/QA-CHECKLIST.md` vyber řádky, jejichž sloupec "Etapa" je ≤ aktuální etapa a které se týkají změn.
4. Každý scénář proveď prohlížečovým agentem jako skutečný uživatel (klikání, psaní, klávesnice). Použij účty ze `docs/SEED-DATA.md`.
5. U UI scénářů pořiď snímek do `docs/screenshots/etapa-N/`.
6. Sleduj konzoli prohlížeče a síťové požadavky; chyby a varování jsou selhání.
7. Výsledek každého scénáře zapiš (☑ nebo ☐ + poznámka) do `docs/QA-CHECKLIST.md`.
8. Selhání oprav, scénář projdi znovu a teprve potom odškrtni.
