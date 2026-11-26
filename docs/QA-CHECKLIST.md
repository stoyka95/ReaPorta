# QA-CHECKLIST.md — kontrola v prohlížeči

> Agent s prohlížečem prochází scénáře jako skutečný uživatel. U každého: provést, pořídit snímek (u UI změn), odškrtnout. Selhání se zapíše do `STAGE_LOG.md` s popisem a opraví se. Přihlašovací údaje ze seedu jsou v `docs/SEED-DATA.md`.

Legenda: ☐ nehotovo · ☑ hotovo. Sloupec "Etapa" říká, od kdy má scénář procházet.

## A. Veřejná část (od etapy 3–6)

| #     | Scénář                                                           | Očekávání                                                                                                | Etapa |
| ----- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----- |
| ☑ A1  | Otevřít `/` na 390 px a 1280 px                                  | Hero, vyhledávací panel, sekce s daty z DB, žádný vodorovný posuvník                                     | 3     |
| ☑ A2  | V hero vybrat _Pronájem → Byty → "brn"_ a hledat                 | Našeptávač nabídne Brno, přesměruje na `/pronajem/byty/...brno`, výpis jen pronájmy bytů v Brně          | 3–4   |
| ☑ A3  | Na výpisu nastavit cenu od–do, 2+kk a 3+kk, balkon               | Počet výsledků se změní, URL obsahuje filtry, karty odpovídají                                           | 4     |
| ☑ A4  | Stisknout Zpět a Vpřed v prohlížeči                              | Filtry a výsledky se vrací správně                                                                       | 4     |
| ☑ A5  | Zkopírovat URL do nového okna                                    | Stejný výsledek, stejné filtry                                                                           | 4     |
| ☑ A6  | Přenastavit filtry na kombinaci bez výsledků                     | Prázdný stav s návrhem a tlačítkem _Zrušit filtry_                                                       | 4     |
| ☑ A7  | Seřadit podle nejnižší ceny za m²                                | Pořadí odpovídá (ověřit na prvních 5 kartách)                                                            | 4     |
| ☑ A8  | Přejít na stránku 2 a zpět                                       | Stránkování funguje, scroll je rozumný                                                                   | 4     |
| ☑ A9  | Zapnout mapu, oddálit/přiblížit                                  | Shluky → cenové značky; přiblížení shluku klikem                                                         | 5     |
| ☑ A10 | Posunout mapu s _Hledat při pohybu mapy_                         | Výpis a počet se přizpůsobí, URL obsahuje bbox                                                           | 5     |
| ☑ A11 | Hover karty ↔ značky                                             | Vzájemné zvýraznění                                                                                      | 5     |
| ☑ A12 | Mobil: tlačítko _Mapa_, vybrat značku                            | Celoobrazovková mapa, bottom sheet s kartou                                                              | 5     |
| ☑ A13 | Otevřít detail, projít galerii a lightbox klávesnicí (←, →, Esc) | Funguje, focus se vrací                                                                                  | 6     |
| ☑ A14 | Detail: _Zobrazit telefon_                                       | Číslo se zobrazí až po kliknutí (v HTML před tím není)                                                   | 6     |
| ☑ A15 | Detail: odeslat poptávku s chybnými i správnými údaji            | Validační hlášky česky; úspěch → potvrzení, záznam v DB, e-mail v `email_outbox`                         | 6     |
| ☑ A16 | Detail: hypoteční kalkulačka                                     | 5 000 000 Kč, 20 % vlastní, 5 % p. a., 30 let → úvěr 4 000 000 Kč, splátka ≈ 21 473 Kč (tolerance ±5 Kč) | 6     |
| ☑ A17 | Detail inzerátu `sold` a `expired`                               | Zobrazí se upozornění a podobné nabídky, ne 404                                                          | 6     |
| ☑ A18 | Detail neexistujícího slugu                                      | Vlastní 404                                                                                              | 6     |
| ☑ A19 | Inzerát s `show_exact_location = false`                          | Na mapě kruh, ne přesná značka                                                                           | 5–6   |
| ☑ A20 | Vypnout síť pro mapové dlaždice (DevTools)                       | Hláška u mapy, výpis dál funguje                                                                         | 5     |

## B. Účty (od etapy 7)

| #    | Scénář                                                                           | Očekávání                                                               |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| ☑ B1 | Registrace s existujícím e-mailem                                                | Srozumitelná chyba, bez prozrazení detailů nad rámec nutného            |
| ☑ B2 | Registrace → e-mail s odkazem → ověření → přihlášení                             | Funguje; nepřihlášený nemá přístup na `/ucet` (přesměrování s `?next=`) |
| ☑ B3 | 6 chybných přihlášení za sebou                                                   | Rate limit s hláškou                                                    |
| ☑ B4 | Oblíbené: přidat srdcem na kartě i detailu, zobrazit v `/ucet/oblibene`, odebrat | Stav konzistentní napříč stránkami, optimistický update                 |
| ☑ B5 | Nepřihlášený klikne na srdce                                                     | Výzva k přihlášení, po přihlášení se akce provede                       |
| ☑ B6 | Uložit hledání, změnit frekvenci, smazat                                         | Funguje                                                                 |
| ☑ B7 | `pnpm job:alerts` po vytvoření nové odpovídající nabídky                         | Jeden e-mail; druhé spuštění nic neposílá                               |
| ☑ B8 | Zapomenuté heslo → reset                                                         | Funguje, starý odkaz po použití neplatí                                 |
| ☑ B9 | Smazání účtu                                                                     | Oblíbené pryč, poptávky anonymizované                                   |

## C. Makléř (od etapy 8–9)

| #     | Scénář                                                                              | Očekávání                                                                  |
| ----- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ☑ C1  | Přihlásit `makler@reaporta.test`, otevřít `/dashboard`                              | Přehled s čísly a grafem                                                   |
| ☑ C2  | Průvodce: vložit byt s 8 fotkami (jedna 15 MB, jedna `.txt` přejmenovaná na `.jpg`) | Velký soubor odmítnut s hláškou, falešný obrázek odmítnut, ostatní nahrány |
| ☑ C3  | V průvodci přetáhnout pořadí fotek, nastavit úvodní                                 | Pořadí se uloží, úvodní se zobrazí na kartě                                |
| ☑ C4  | Zavřít prohlížeč uprostřed průvodce, vrátit se                                      | Koncept zůstal, pokračuje se od posledního kroku                           |
| ☑ C5  | Odeslat do moderace                                                                 | Stav `pending`, na veřejném webu není                                      |
| ☐ C6  | Po schválení adminem                                                                | Inzerát je na výpisu a na mapě                                             |
| ☑ C7  | Změnit cenu aktivního inzerátu                                                      | Historie ceny, štítek _Zlevněno_ při snížení                               |
| ☑ C8  | Pozastavit, obnovit, duplikovat, smazat                                             | Funguje; smazání vyžaduje potvrzení a odstraní soubory                     |
| ☑ C9  | IDOR: otevřít `/dashboard/inzeraty/<id cizího>/upravit`                             | 403/404, žádná data                                                        |
| ☑ C10 | Poptávky: označit jako přečtenou, zodpovězenou, archivovat                          | Funguje, počítadla v menu                                                  |
| ☑ C11 | Veřejný profil makléře a agentury                                                   | Zobrazí jen aktivní nabídky                                                |

## D. Admin (od etapy 10)

| #    | Scénář                                         | Očekávání                                          |
| ---- | ---------------------------------------------- | -------------------------------------------------- |
| ☐ D1 | Přihlásit `admin@reaporta.test`                | Přehled s frontou                                  |
| ☐ D2 | Schválit a zamítnout inzerát (s důvodem)       | E-mail makléři, stav se změní, záznam v audit logu |
| ☐ D3 | Zablokovat uživatele                           | Nemůže se přihlásit                                |
| ☐ D4 | Vyřešit nahlášení (skrýt inzerát)              | Inzerát zmizí z veřejných výpisů                   |
| ☐ D5 | Přihlásit běžného uživatele a otevřít `/admin` | 403 stránka v designu aplikace                     |

## E. Průřezové

| #     | Kontrola                                                                                                         | Očekávání                                                                             |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ☐ E1  | Axe na úvodu, výpisu, detailu, přihlášení, průvodci, dashboardu, adminu                                          | 0 kritických a vážných chyb                                                           |
| ☐ E2  | Celý průchod výpisem a detailem jen klávesnicí                                                                   | Vše dostupné, focus viditelný                                                         |
| ☐ E3  | `prefers-reduced-motion` a `prefers-reduced-transparency`                                                        | Animace a sklo se zjednoduší                                                          |
| ☐ E4  | Lighthouse (produkční build, mobil) úvod/výpis/detail                                                            | Výkon ≥ 85, přístupnost ≥ 95, SEO ≥ 95                                                |
| ☑ E5  | `view-source` detailu                                                                                            | JSON-LD, meta, canonical, OG                                                          |
| ☐ E6  | `/sitemap.xml`, `/robots.txt`                                                                                    | Platné, neobsahují koncepty ani neaktivní inzeráty                                    |
| ☑ E7  | Čeština: 1, 2, 5, 11, 21 nabídek                                                                                 | Správné plurály (_1 nabídka, 2 nabídky, 5 nabídek, 11 nabídek, 21 nabídek_)           |
| ☑ E8  | Ceny a plochy                                                                                                    | `5 990 000 Kč`, `25 000 Kč/měsíc`, `78 m²` s nezlomitelnými mezerami                  |
| ☐ E9  | Vizuální rubrika (`DESIGN.md` kap. 13) 390/768/1280/1536 px na všech klíčových stránkách                         | ≥ 4/5 v každém kritériu (veřejné stránky etapy 0–6 ověřeny 5/5)                       |
| ☑ E10 | `pnpm check:tokens`                                                                                              | Žádné hex barvy ani magická čísla v komponentách                                      |
| ☑ E11 | Dev konzole prohlížeče na všech klíčových stránkách                                                              | Bez chyb a varování (kromě známých, zapsaných v `DECISIONS.md`)                       |
| ☑ E13 | Logo: favicon v záložce, navigace (desktop 32 px, mobil 28 px), patička, e-mail z `email_outbox`, sdílený náhled | Logo je ostré a čitelné všude, žádné rozmazané okraje; na skle i fotce dobrý kontrast |
| ☐ E12 | Čistá instalace podle `README.md` na prázdné DB                                                                  | Aplikace naběhne do 10 minut                                                          |
