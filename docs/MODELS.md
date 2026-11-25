# MODELS.md — kterému modelu v Antigravity zadat kterou etapu

> Stav k 25. 11. 2026. Názvy, dostupnost a výchozí úrovně se mění; vždy ověř v nabídce modelů v Antigravity. Tohle je doporučení, ne pravidlo. Pokud je výsledek slabý, přepni model a zkus znovu.

## Jak přepínat

- **Jedna etapa = jedna konverzace (nový agent).** Kontext mezi etapami nese `docs/STAGE_LOG.md` a git, ne paměť konverzace. Model a úroveň přemýšlení (effort) měň **na hranici etap**, ne uprostřed.
- Začátek každé etapy: `/start-stage N` (workflow v `.agents/workflows/`).
- Effort: `Medium` stačí na jasné úkoly, `High` na etapy s rozhodováním, `Extra/xhigh` jen na jeden konkrétní zapeklitý problém (je drahé a pomalé).
- Pokud agent dvakrát za sebou nezvládne totéž (chyba se vrací), zvyš model nebo effort a použij prompt "Agent se zasekl" z `prompts/04-unstuck.md`.

## Role modelů

| Model | K čemu |
|---|---|
| **Gemini 4 Hydrogen** | rychlé a levné provádění jasného zadání: boilerplate, testy, skripty, opakující se úpravy |
| **Gemini 4 Neon** | výchozí pracovní kůň: funkce na více souborech, refaktor, rozhodování o rozhraní |
| **Gemini 4 Carbon** | nejhlubší práce: dlouhé etapy s mnoha souvislostmi, bezpečnostní a výkonnostní revize, těžké chyby |
| **Orchestrator (Neon)** | Neon plánuje a kontroluje, Hydrogen implementuje; dobré na jasný cíl o více krocích |
| **Orchestrator (Carbon)** | totéž s Carbonem jako plánovačem; na nejnáročnější etapy |
| **Claude Opus 5.5 / Sonnet 5.5** | druhý názor a vizuální/textová práce; vhodné pro design systém, logo a české texty (viz A/B test níže) |
| Argon, Gemini 3.8 Flash | v nabídce označené "Leaving Soon", nepoužívat pro nové práce |

## Doporučení po etapách

| Etapa | Model | Effort | Poznámka |
|---|---|---|---|
| 0 Základ projektu | Gemini 4 Hydrogen | Medium | jasné kroky, rychlé |
| 1 Databáze a seed | Gemini 4 Neon | High | schéma a indexy jsou rozhodnutí; seed skripty by zvládl i Hydrogen |
| 2 Design systém + logo | Gemini 4 Neon **a** Claude Opus 5.5 | High | proveď A/B: stejné zadání logo + styleguide oběma, vyber lepší výsledek (rubrika `DESIGN.md` kap. 13) |
| 3 Layout a úvod | Orchestrator (Neon) | fixní | mnoho souborů, jasný cíl |
| 4 Vyhledávání | Gemini 4 Neon | High | builder dotazů a výkon vyžadují přesnost |
| 5 Mapa | Gemini 4 Neon | High | interakce, stav v URL, výkon |
| 6 Detail nabídky | Orchestrator (Neon) | fixní | |
| 7 Účty a upozornění | Gemini 4 Carbon | Medium–High | autentizace a bezpečnost; po dokončení revize bezpečnosti |
| 8 Dashboard a průvodce | Gemini 4 Neon | High | upload, autosave, oprávnění |
| 9 Poptávky a profily | Orchestrator (Neon) | fixní | |
| 10 Administrace | Orchestrator (Neon) nebo Hydrogen | fixní / High | opakující se vzory |
| 11 SEO, přístupnost, výkon, bezpečnost | Gemini 4 Carbon | High | měření a hluboká revize |
| 12 E2E a finální QA | Hydrogen (psaní testů) → Carbon (závěrečná revize) | High | |
| Vizuální revize (`prompts/03`) | Claude Opus 5.5 nebo Neon | High | |
| Zapeklitá chyba | Gemini 4 Carbon | High (xhigh až po neúspěchu) | použij `prompts/04-unstuck.md` |

## A/B test pro design (etapa 2)

1. Vytvoř větev `design-neon` a `design-claude`.
2. Stejný prompt z `prompts/01-RUN-A.md`, ale jen etapa 2 (design systém, logo, styleguide).
3. Porovnej snímky `/dev/styleguide` a logo ve 4 šířkách podle rubriky. Lepší větev sloučit do `main`, druhou smazat.
