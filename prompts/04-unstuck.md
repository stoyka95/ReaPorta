# Prompty pro krizové situace

## Agent se zasekl nebo se motá v kruhu
```
Zastav se. Napiš: (1) co jsi chtěl udělat, (2) co jsi zkusil, (3) co přesně selhává (chyba, výstup),
(4) tři možné příčiny seřazené podle pravděpodobnosti. Pak vyzkoušej nejpravděpodobnější příčinu
JEDNÍM cílenou změnou a ověř. Nezkoušej další náhodné úpravy. Pokud to po 3 pokusech nejde,
zapiš problém do docs/OPEN-QUESTIONS.md, zvol obchozí řešení a pokračuj další částí etapy.
```

## Agent se odchýlil od zadání
```
Porovnej aktuální stav s docs/PLAN.md etapa N a docs/SPEC.md (AC dané etapy). Vypiš v tabulce,
které AC jsou splněna, částečně splněna a nesplněna, a odchylky od ARCHITECTURE.md a DESIGN.md.
Neopravuj nic, dokud tabulku nepředložíš. Potom oprav nesplněné body v pořadí důležitosti.
```

## Rozbitý build nebo spadlé testy
```
Nejdřív pnpm typecheck, pak pnpm lint, pak pnpm test. Oprav chyby v tomto pořadí, vždy od první
chyby v řadě (ostatní jsou často následné). Po každé opravě spusť znovu. Nemaž ani nezakomentovávej
testy, aby prošly; pokud je test špatně, oprav test a zapiš proč do docs/DECISIONS.md.
```

## Návrat po přerušení (nová konverzace)
```
Pokračuješ v projektu ReaPorta. Přečti AGENTS.md, docs/STAGE_LOG.md a docs/PLAN.md. Zjisti z git logu
a STAGE_LOG.md, která etapa je rozpracovaná, spusť pnpm typecheck && pnpm lint && pnpm test
a ověř, že je základ zdravý. Pak pokračuj další nehotovou etapou.
```

## Kontrola bezpečnosti (kdykoli po etapě 8)
```
Proveď bezpečnostní revizi podle docs/ARCHITECTURE.md kap. 11. Pro každý řádek tabulky najdi
v kódu konkrétní místo, které hrozbu řeší, a napiš test nebo ruční ověření. Zvlášť zkus:
přístup k cizímu inzerátu, cizí poptávce a cizím souborům (IDOR), nahrání škodlivého souboru
s příponou .jpg, XSS v popisu inzerátu a jménu, a překročení rate limitů. Nálezy opravuj
a zapiš do docs/STAGE_LOG.md.
```
