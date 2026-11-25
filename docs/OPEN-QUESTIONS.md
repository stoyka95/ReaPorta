# OPEN-QUESTIONS.md — otevřené otázky a zvolené výchozí hodnoty

> Postup: když narazíš na rozhodnutí, které z dokumentace nejde vyčíst, **nezastavuj se**. Zapiš sem otázku, zvolenou výchozí variantu a důvod, a pokračuj. Člověk to ráno projde a případně změní.
>
> Tabulka níže už obsahuje rozhodnutí, která jsou předem zodpovězena. Neptej se na ně znovu.

## Již rozhodnuto

| Téma | Rozhodnutí |
|---|---|
| Název značky | **ReaPorta** (finální), konfigurace v `src/config/brand.ts` |
| Logo | Navrhne agent v etapě 2 podle `DESIGN.md` kap. 15 (3 směry, vybrat, zdůvodnit v `docs/BRAND.md`); člověk může později vyměnit |
| GitHub repozitář | `stoyka95/ReaPorta` (veřejný), větev `main` |
| Jazyk UI | Pouze čeština, **vykání**, texty v `messages/cs.json` |
| Databáze | Lokální PostgreSQL, bez Supabase a bez cloudu |
| Styl UI | Světlé sklo (glass) + jemné přechody |
| Barvy | Neutrální šedá + jedna fialová (`--violet-600`) |
| Písma | Fraunces (nadpisy) + Inter (text) |
| Tmavý režim | Ne (mimo rozsah) |
| Platby, prémiové inzeráty, chat, import XML | Ne (mimo rozsah) |
| Nasazení | Ne (jen dokumentace v `DEPLOY.md`) |
| Fotky v seedu | Generované SVG→WebP; skutečné jen z `seed/photos` s právy uživatele |
| Mapové podklady | MapLibre + bezklíčový styl, nastavitelný přes env |
| Geokódování | Výchozí `GEOCODER=none`: souřadnice se zadávají posunutím špendlíku, našeptávač adres je volitelný |
| Registrace makléře | Bez ověřování (volba při registraci), admin může roli odebrat |
| E-maily | Dev: Mailpit/outbox; produkční poskytovatel později |
| Reálná data a cizí obsah | Nikdy; žádné stahování z jiných realitních portálů |

## Otevřené (doplňuje agent během práce)

| Datum | Etapa | Otázka | Zvolená výchozí varianta | Důvod |
|---|---|---|---|---|
| | | | | |
