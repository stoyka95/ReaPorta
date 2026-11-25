# Prompt pro běh B — aplikace (etapy 7–12)

> Spouští se až po kontrole běhu A. Nový agent (nebo nová konverzace) ve stejném workspace.

---

```
Pokračuješ ve stavbě realitního portálu "ReaPorta". Běh A (etapy 0–6) je hotový.
Přečti AGENTS.md a pak docs/STAGE_LOG.md (zejména souhrn Běhu A a známé problémy),
docs/PLAN.md, docs/SPEC.md, docs/ARCHITECTURE.md, DESIGN.md, docs/QA-CHECKLIST.md.

ÚKOL: dokonči etapy 7 až 12 z docs/PLAN.md (Běh B), jednu po druhé.
Postup u každé etapy je stejný jako v Běhu A (plán → malé kroky → ověření v prohlížeči
a testy → opravy → commit "etapa N: …" → záznam do docs/STAGE_LOG.md).

NAVÍC V TOMTO BĚHU:
- Autorizace a bezpečnost jsou prioritní. U každé mutace ověř session, roli a vlastnictví na
  serveru a napiš test, že cizí uživatel dostane odmítnutí (IDOR).
- Uploady: kontrola magic bytes, limity, re-enkódování sharp, odstranění EXIF/GPS.
- E-maily: v dev se nic neodesílá ven (Mailpit/outbox). Ověř každou šablonu vizuálně.
- Průvodce vložením inzerátu a dashboard dělej s největší péčí o UX: autosave, validace po
  krocích, srozumitelné chyby česky, žádná ztráta dat.
- Etapa 11 (SEO, přístupnost, výkon, bezpečnost) je povinná a měřená; zapiš čísla do STAGE_LOG.md
  a docs/PERF.md.
- Etapa 12: po vlastním dokončení projdi CELÝ docs/QA-CHECKLIST.md v prohlížeči, odškrtni
  položky a opravy všeho, co selže. Pak finální vizuální QA všech klíčových stránek.

Pravidla z AGENTS.md platí beze změny (jen tokeny z DESIGN.md, žádná reálná data, žádné
nasazení, žádné skutečné e-maily, neptej se na věci z OPEN-QUESTIONS.md).

NA KONCI: do docs/STAGE_LOG.md napiš "Závěrečnou zprávu" (co je hotovo podle AC, výsledky měření,
seznam známých omezení, doporučení pro další vývoj) a zastav se.
```
