# Prompt pro běh A — veřejná část (etapy 0–6)

> Jak použít: otevři složku projektu v Antigravity (Editor), přepni do Agent Manageru, vytvoř nového agenta ve workspace tohoto repa a vlož text níže. Režim: **Planning**, model podle nabídky (nejschopnější dostupný). Terminal policy: nastav na povolení běžných příkazů (`pnpm`, `git`, `psql`, `docker compose`). Povol prohlížečového agenta.

---

```
Stavíš český realitní portál "ReaPorta" podle dokumentace v tomto repozitáři.
Nejdřív si přečti AGENTS.md (načte se automaticky) a potom v tomto pořadí:
docs/STAGE_LOG.md, docs/PLAN.md, docs/SPEC.md, docs/ARCHITECTURE.md, DESIGN.md,
docs/SEED-DATA.md, docs/QA-CHECKLIST.md, docs/OPEN-QUESTIONS.md.

ÚKOL: dokonči etapy 0 až 6 z docs/PLAN.md (Běh A), jednu po druhé, v tomto pořadí.

PRACOVNÍ POSTUP U KAŽDÉ ETAPY:
1. Vytvoř krátký Implementation Plan (soubory, kroky, rizika). Nečekej na schválení.
2. Implementuj po malých krocích; po každém kroku pnpm typecheck && pnpm lint.
3. Ověř: testy, aplikace v prohlížeči (scénáře z docs/QA-CHECKLIST.md pro danou etapu),
   snímky UI ve 4 šířkách (390, 768, 1280, 1536) uložené do docs/screenshots/etapa-N/.
4. Oprav, co selhalo, a ověř znovu.
5. Commit "etapa N: popis (AC-x.y …)" a záznam do docs/STAGE_LOG.md.

DŮLEŽITÉ:
- Vzhled řiď POUZE souborem DESIGN.md. Žádné hex barvy ani pevné hodnoty v komponentách,
  jen tokeny. Světlé sklo + jemné přechody, neutrální šedá + jedna fialová, Fraunces + Inter.
- V etapě 2 navrhni také LOGO podle DESIGN.md kap. 15 (3 směry v SVG, kontaktní arch, výběr se
  zdůvodněním v docs/BRAND.md). Název značky je ReaPorta.
- Etapa 2 je klíčová pro kvalitu. Nepřecházej na etapu 3, dokud /dev/styleguide
  nesplňuje vizuální rubriku z DESIGN.md kap. 13 (min. 4/5 v každém kritériu).
- Databáze je LOKÁLNÍ PostgreSQL (DATABASE_URL v .env), žádný Supabase ani cloud.
- Když narazíš na nejasnost, kterou dokumentace nevyřeší, zapiš ji do docs/OPEN-QUESTIONS.md
  s výchozí variantou a pokračuj. Neptej se, nezastavuj se.
- Nikdy neříkej, že něco funguje, pokud jsi to nespustil a neověřil.
- Nenasazuj, neposílej skutečné e-maily, nestahuj nic z cizích realitních portálů.

KDYŽ BUDEŠ HOTOVÝ S ETAPOU 6: napiš do docs/STAGE_LOG.md souhrn Běhu A (co funguje, výsledky
měření, známé problémy, odchylky) a ZASTAV SE. Další etapy (7–12) jsou samostatný běh.
```

---

## Co zkontrolovat po běhu A (člověk, ~10 minut)

1. `pnpm install && pnpm db:reset && pnpm dev` → otevři `http://localhost:3000`.
2. Projdi `/dev/styleguide`: vypadá to jako `DESIGN.md`? Fialová jen u akcí? Sklo čitelné?
3. Zkus výpis s mapou na mobilu i desktopu.
4. Otevři `docs/screenshots/` a `docs/STAGE_LOG.md`.
5. Cokoli, co se ti nelíbí, **uprav v `DESIGN.md`** (ne v kódu) a nech agenta opravit podle `prompts/03-design-review.md`.
