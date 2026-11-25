---
description: Uzavře etapu: závěrečné kontroly, commit a záznam do docs/STAGE_LOG.md
---

1. Spusť `pnpm typecheck && pnpm lint && pnpm test`. U etap s UI také `pnpm test:e2e` a `pnpm check:tokens`.
2. Ověř "Hotovo když" dané etapy bod po bodu a vypiš, které AC jsou splněna.
3. Přidej nový záznam na začátek `docs/STAGE_LOG.md` ve formátu z hlavičky souboru (hotovo, odchylky, měření, snímky, zbývá, další krok).
4. Odchylky od `docs/ARCHITECTURE.md` zapiš do `docs/DECISIONS.md`.
5. `git add -A && git commit -m "etapa N: <popis> (AC-…)"`.
6. Vytvoř artefakt Walkthrough: co je hotovo, snímky, výsledky testů, známé problémy.
7. Pokud je to poslední etapa běhu (6 nebo 12), zastav se a napiš souhrn běhu. Jinak pokračuj další etapou přes `/start-stage`.
