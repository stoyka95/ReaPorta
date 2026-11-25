# SEED-DATA.md — testovací data

> Všechna data jsou **smyšlená**. Nepoužívej reálné inzeráty, texty ani fotografie z cizích portálů. Seed je deterministický (pevný `faker.seed(2026)`), takže dva běhy dají stejnou databázi.

## Objem

| Entita | Počet |
|---|---|
| Admin | 1 (`admin@reaporta.test`) |
| Agentury | 4 (různé velikosti, 1 bez loga) |
| Makléři | 14 (2 bez agentury = soukromí inzerenti), 1 s účtem `makler@reaporta.test` |
| Běžní uživatelé | 8 (`uzivatel@reaporta.test` má oblíbené a 2 uložená hledání) |
| Lokality | 14 krajů, ~77 okresů, ~60 největších obcí a měst včetně městských částí Prahy a Brna (částí `cast` ~120) |
| Inzeráty | **~400** (360 `active`, 20 `pending`, 8 `draft`, 6 `sold`, 4 `expired`, 2 `rejected`) |
| Fotky | 6–14 na inzerát (generované) |
| Poptávky | ~60 |
| Nahlášení | 5 |
| Statistiky | 30 dní zobrazení pro každý aktivní inzerát |

Všechna hesla seedovaných účtů: `Heslo12345!` (jen dev, vypsat v README).

## Rozložení inzerátů

- Nabídka: 55 % prodej, 45 % pronájem.
- Kategorie: byty 55 %, domy 25 %, pozemky 8 %, komerční 8 %, ostatní 4 %.
- Města: Praha 28 %, Brno 14 %, Ostrava 8 %, Plzeň 6 %, Olomouc 4 %, Liberec 4 %, České Budějovice 4 %, Hradec Králové 4 %, Pardubice 3 %, Zlín 3 %, Ústí n. L. 3 %, Karlovy Vary 2 %, Jihlava 2 %, zbytek okolí a menší obce.
- Souřadnice: v okolí středu obce/části s rozptylem do ~3 km (města) nebo ~10 km (venkov). U ~35 % inzerátů `show_exact_location = false`.

## Realistické rozsahy (orientační, smyšlené)

| Typ | Praha | Brno | Ostrava / menší města |
|---|---|---|---|
| Byt prodej, Kč/m² | 110–190 tis. | 90–140 tis. | 40–85 tis. |
| Byt pronájem, Kč/m²/měs. | 330–560 | 280–420 | 150–300 |
| Dům prodej (celkem) | 9–35 mil. | 7–25 mil. | 3–12 mil. |
| Pozemek, Kč/m² | 4–25 tis. | 3–12 tis. | 0,3–4 tis. |

Plochy: 1+kk 22–38 m², 2+kk 40–62, 3+kk 65–95, 4+kk 90–130; domy 90–320 m², pozemky 400–5 000 m². Patro 0–12, `floors_total` ≥ patro. Rok výstavby 1890–2026 (panelové 1960–1992). PENB rozdělení: A–B 18 %, C–D 50 %, E–G 27 %, neuvedeno 5 %. Vybavení náhodné, ale konzistentní (výtah jen v domech s ≥ 4 podlažími).

## Popisy

Generuj z **šablon** (ne z jednoho opakovaného textu): úvodní věta podle typu, 2–3 odstavce (dispozice a stav, okolí a doprava, vybavení), závěrečná věta. Alespoň 12 variant úvodních a 10 variant okolí na kategorii, aby výpis nepůsobil kopírovaně. Správná čeština (pády, shoda). Žádný text nesmí obsahovat reálné ulice s číslem popisným ve spojení s osobními údaji; ulice jsou běžná jména (Lipová, Zahradní…) s náhodným číslem.

Tituly: `Prodej bytu 3+kk, 78 m², Praha 5 – Smíchov` (formát z kategorie, dispozice, plochy a lokality).

## Fotky (`pnpm photos:generate`)

Skript vytvoří **bazén ~40 základních obrázků** (1600×1067) a z něj vyrobí sady pro inzeráty:
- stylizované interiéry a exteriéry vykreslené jako SVG (stěny, okna, nábytek v jednoduchých tvarech, světlo), převedené `sharp` na WebP;
- paleta: neutrální šedé, teplé béžové a jemné fialové akcenty (ladí s `DESIGN.md`), s drobnými odchylkami odstínu pro rozmanitost;
- každý inzerát dostane 6–14 obrázků z bazénu, úvodní je vždy exteriér/hlavní místnost; alt texty se generují (`Obývací pokoj bytu 3+kk, …, foto 3 z 12`);
- místo pro skutečné fotky: pokud existuje `seed/photos/*.jpg`, použijí se přednostně (uživatel si je může doplnit; musí mít na ně práva).

## Konzistence a hrany (musí být v seedu, aby se daly testovat)

- Inzerát s 1 fotkou, s 40 fotkami, bez fotky (zástupný obrázek).
- Inzerát s `price_on_request`, s `price_negotiable`, s velmi dlouhým názvem (zalomení), s velmi dlouhým popisem.
- Pronájem s poplatky a kaucí; byt bez uvedeného PENB; pozemek bez dispozice.
- Makléř bez fotky (iniciály), agentura bez loga.
- Inzerát s historií změny ceny (snížená cena → štítek *Zlevněno*).
- Uživatel s 0 oblíbenými a uživatel s 25.
- Lokalita s 0 nabídkami.
