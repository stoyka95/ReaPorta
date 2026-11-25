# SPEC.md — ReaPorta: realitní portál (MVP)

> Produktová specifikace. Co se staví, pro koho a kdy je co hotovo. Technické řešení je v `ARCHITECTURE.md`, vzhled v `/DESIGN.md`, pořadí práce v `PLAN.md`.

## 1. Co to je

**ReaPorta** je český realitní portál: inzerce a hledání nemovitostí k prodeji a pronájmu. Funkčně je to vlastní implementace známého typu produktu (inzertní portál s filtry, mapou, detailem nabídky, účty makléřů a administrací). Vlastní název, vlastní design, vlastní texty a data. Nic se nekopíruje z existujících portálů (kód, obrázky, texty, inzeráty).

**Cíl tohoto zadání:** plně funkční MVP běžící lokálně (PostgreSQL), s naplněnými ukázkovými daty, s vizuálně propracovaným UI podle `DESIGN.md`, připravené na pozdější nasazení.

## 2. Uživatelské role

| Role | Popis | Hlavní možnosti |
|---|---|---|
| **Návštěvník** | nepřihlášený | hledá, prohlíží detail, píše makléři, zobrazí telefon |
| **Uživatel** | přihlášený (`user`) | oblíbené, uložená hledání s upozorněními, historie poptávek |
| **Makléř / vlastník** | `agent` | vkládá a spravuje inzeráty, poptávky, statistiky, veřejný profil |
| **Admin** | `admin` | moderace inzerátů, správa uživatelů, agentur, nahlášení, lokalit |

Registrace je jedna; role `agent` se získá volbou *"Chci inzerovat"* při registraci (v MVP bez ověřování, admin může roli odebrat).

## 3. Rozsah MVP

**V rozsahu:** vše v kapitolách 4–14.
**Mimo rozsah (neděláme):** platby a prémiové inzeráty, import z XML/API, chat v reálném čase, mobilní aplikace, vícejazyčnost (UI jen česky, ale texty v `messages/cs.json`), tmavý režim, skutečné napojení na ARES/RÚIAN/katastr, hypoteční zprostředkování.
**Stretch (jen pokud zbude čas po etapě 12):** přirozený jazyk ve vyhledávání ("3+kk v Brně do 8 milionů s balkonem"), generátor popisu inzerátu, srovnání nabídek.

## 4. Moduly a akceptační kritéria

Každé kritérium (AC) musí jít ověřit v prohlížeči nebo testem. ID slouží v commitech a ve `STAGE_LOG.md`.

### M1 — Úvodní stránka (`/`)
- **AC-1.1** Hero s vyhledávacím panelem: přepínač Prodej/Pronájem, kategorie, lokalita s našeptávačem, tlačítko Hledat → přesměruje na výpis se správnými filtry.
- **AC-1.2** Dlaždice kategorií vedou na příslušný výpis.
- **AC-1.3** Sekce *Nové nabídky* a *Doporučené* načítají reálná data z DB (ne pevně vložená).
- **AC-1.4** Sekce *Oblíbené lokality* ukazuje 8 měst s aktuálním počtem aktivních nabídek.
- **AC-1.5** Responzivní od 360 px do 1920 px bez vodorovného posuvníku.

### M2 — Vyhledávání a výpis (`/prodej/...`, `/pronajem/...`)
- **AC-2.1** Filtry: typ nabídky, kategorie, lokalita (kraj/okres/obec/část, více výběrů), cena od–do, užitná plocha od–do, plocha pozemku (domy, pozemky), dispozice (více výběrů), stav, typ stavby, vlastnictví, patro, PENB, vybavení (balkon, terasa, lodžie, sklep, výtah, garáž, parkování, zahrada, bezbariérový, klimatizace), vybaveno/nevybaveno, dostupné od, stáří inzerátu (dnes, 7 dní, 30 dní), fulltext.
- **AC-2.2** Řazení: nejnovější, nejlevnější, nejdražší, největší plocha, nejnižší cena za m².
- **AC-2.3** Stav filtrů je **vždy v URL** (sdílitelný odkaz, tlačítko Zpět funguje). Obnovení stránky vrátí stejný výsledek.
- **AC-2.4** Stránkování po 24 nabídkách; počet výsledků se aktualizuje bez načtení celé stránky; při změně filtru se výpis nescrolluje na začátek, pokud uživatel nezměnil stránku.
- **AC-2.5** Našeptávač lokalit toleruje diakritiku a překlepy (*"plzen"* najde Plzeň, *"brn"* najde Brno), řadí podle relevance a velikosti.
- **AC-2.6** Dotaz s 10 000 nabídkami odpoví do 300 ms (lokální DB, měřeno na serveru).
- **AC-2.7** Prázdný výsledek ukáže návrh (rozšířit lokalitu, zrušit filtry).
- **AC-2.8** Uložení hledání (tlačítko) – přihlášený uživatel jedním klikem, nepřihlášený je vyzván k přihlášení a po přihlášení se hledání uloží.

### M3 — Mapa
- **AC-3.1** Mapa vedle výpisu (desktop) a celoobrazovková varianta (mobil), shluky při oddálení, cenové značky při přiblížení.
- **AC-3.2** *Hledat při pohybu mapy* přepíná omezení výsledků na viditelnou oblast (bbox je v URL).
- **AC-3.3** Hover/klik na kartu zvýrazní značku a naopak; klik na značku otevře náhledovou kartu.
- **AC-3.4** Značky se nikdy nezobrazí přesně, pokud má inzerát `show_exact_location = false` (poloha se zaokrouhlí na ~300 m a místo značky je kruh).
- **AC-3.5** Mapa funguje s klávesnicí (focus na značkách) a má textovou alternativu (výpis).

### M4 — Detail nabídky (`/nemovitost/[slug]`)
- **AC-4.1** Galerie (mozaika + lightbox s klávesnicí a swipe), lazy loading, správné `sizes`.
- **AC-4.2** Klíčová fakta, popis, tabulka parametrů, vybavení, mapa s polohou, PENB chip, cena za m², poplatky/kauce u pronájmu.
- **AC-4.3** Kontaktní formulář (jméno, e-mail, telefon, zpráva, souhlas) → uloží poptávku, pošle e-mail makléři (v dev do outboxu/Mailpitu), zobrazí potvrzení. Rate limit 5 zpráv/hodinu/IP.
- **AC-4.4** *Zobrazit telefon* odhalí číslo (započítá se do statistik); číslo není v HTML před kliknutím.
- **AC-4.5** Oblíbené (srdce) pro přihlášené i nepřihlášené (nepřihlášení → výzva k přihlášení).
- **AC-4.6** Hypoteční kalkulačka (cena, vlastní zdroje, úrok, doba → měsíční splátka), výpočet musí být správný anuitně.
- **AC-4.7** Podobné nabídky (stejná kategorie, lokalita, cena ±25 %).
- **AC-4.8** Nahlásit inzerát (důvod + detail).
- **AC-4.9** SEO: `<title>`, meta description, canonical, Open Graph (včetně dynamického obrázku), JSON-LD `RealEstateListing`/`Offer`.
- **AC-4.10** Neaktivní inzerát (prodáno, expirováno) zobrazí detail s upozorněním a podobnými nabídkami, nevrací 404; koncept/zamítnutý vidí jen vlastník a admin.

### M5 — Účty
- **AC-5.1** Registrace (e-mail, heslo ≥ 10 znaků, jméno, volba *Chci inzerovat*), ověření e-mailu odkazem, přihlášení, odhlášení, zapomenuté heslo, změna hesla.
- **AC-5.2** `/ucet`: profil, změna jména/telefonu/fotky, smazání účtu (anonymizuje poptávky, odstraní oblíbené).
- **AC-5.3** `/ucet/oblibene`: seznam oblíbených, odebrání, informace o změně ceny/stavu od uložení.
- **AC-5.4** `/ucet/hledani`: uložená hledání (název, frekvence: ihned/denně/týdně/vypnuto, smazání, otevření).
- **AC-5.5** Upozornění: úloha `pnpm job:alerts` najde nové nabídky odpovídající uloženým hledáním od posledního odeslání a pošle jeden souhrnný e-mail na hledání. Žádné duplicity.
- **AC-5.6** Ochrana: rate limit přihlášení, hesla hashovaná (argon2id), session cookie `HttpOnly; Secure (v produkci); SameSite=Lax`.

### M6 — Dashboard makléře (`/dashboard`)
- **AC-6.1** Přehled: počty inzerátů podle stavu, zobrazení za 30 dní, nové poptávky, graf zobrazení (posledních 30 dní).
- **AC-6.2** Seznam inzerátů s filtrem stavu, hledáním, řazením, hromadnými akcemi (pozastavit, obnovit, smazat).
- **AC-6.3** **Průvodce vložením inzerátu** (kroky: Typ → Adresa a mapa → Parametry → Popis a cena → Fotky → Náhled a odeslání), autosave konceptu, validace po krocích (Zod), lze se vrátit.
- **AC-6.4** Adresa: pole s našeptávačem + posuvná špendlíková značka na mapě; volba *Zobrazit přesnou polohu*.
- **AC-6.5** Fotky: nahrání více souborů najednou (JPG/PNG/WebP, max 12 MB/ks, max 40 ks), náhled, změna pořadí přetažením, volba úvodní, mazání; server vytvoří varianty (thumb, card, full v WebP) a blur placeholder; odmítne soubory, které nejsou obrázek (kontrola magic bytes).
- **AC-6.6** Úprava a duplikace inzerátu. Změna ceny se eviduje (historie ceny).
- **AC-6.7** Životní cyklus: `draft → pending (moderace) → active → paused/sold/expired`; expirace po 60 dnech s možností prodloužit; `rejected` s důvodem od admina.
- **AC-6.8** Makléř vidí a upravuje **jen své** inzeráty (kontrola vlastnictví na serveru, testováno).

### M7 — Poptávky a profily
- **AC-7.1** `/dashboard/poptavky`: schránka poptávek (nová/přečtená/zodpovězená/archiv), detail s odkazem na inzerát, tlačítko *Odpovědět e-mailem* (mailto + označit jako zodpovězenou).
- **AC-7.2** `/makleri/[slug]`: veřejný profil (foto, bio, jazyky, agentura, aktivní nabídky).
- **AC-7.3** `/agentury/[slug]`: stránka agentury (logo, popis, makléři, nabídky).
- **AC-7.4** `/dashboard/profil`: úprava profilu makléře a agentury.
- **AC-7.5** `/dashboard/statistiky`: zobrazení, zobrazení telefonu, oblíbené, poptávky po inzerátech a dnech.

### M8 — Administrace (`/admin`)
- **AC-8.1** Přehled: nové inzeráty ke schválení, nahlášení, nové registrace, celkové počty.
- **AC-8.2** Moderace: fronta `pending`, náhled, schválit / zamítnout s důvodem (e-mail makléři).
- **AC-8.3** Uživatelé: hledání, změna role, zablokování/odblokování, zobrazení aktivity.
- **AC-8.4** Agentury a makléři: CRUD, přiřazení makléře k agentuře.
- **AC-8.5** Nahlášení: seznam, vyřešení (skrýt inzerát / zamítnout nahlášení).
- **AC-8.6** Lokality: prohlížení hierarchie, úprava názvu a souřadnic.
- **AC-8.7** Každá admin akce se zapisuje do `audit_log`.

### M9 — Průřezové požadavky
- **AC-9.1 Výkon:** LCP ≤ 2,5 s na výpisu a detailu (lokální produkční build, simulovaný střední mobil), CLS ≤ 0,05, žádný JS blok > 200 ms v hlavním vlákně při načtení.
- **AC-9.2 Přístupnost:** žádné kritické chyby v axe (testováno automaticky v Playwrightu na klíčových stránkách), vše ovladatelné klávesnicí.
- **AC-9.3 SEO:** `sitemap.xml` (stránkované, inzeráty + makléři + kategorie×města), `robots.txt`, kanonické URL filtrů, `noindex` na kombinace s více než 2 filtry, strukturovaná data, čisté české URL bez diakritiky.
- **AC-9.4 Bezpečnost:** viz `ARCHITECTURE.md` kap. 11 (CSRF, XSS, injection, nahrávání souborů, IDOR, rate limity, hlavičky).
- **AC-9.5 Čeština:** všechny texty v UI a e-mailech česky, správné pády a skloňování množných čísel (*1 nabídka, 2 nabídky, 5 nabídek*), formáty částek, ploch a dat podle `DESIGN.md` kap. 10.
- **AC-9.6 Chybové stránky:** vlastní 404, 500 a stránka *Nemáte oprávnění* ve stylu aplikace.
- **AC-9.8 Značka:** navigace, patička, e-maily, favicon, ikony a výchozí OG obrázek používají logo ReaPorta z `public/brand/`; logo je čitelné ve 16 px; v UI se název značky nikde nepíše natvrdo (vždy z `src/config/brand.ts`).
- **AC-9.7 Právní stránky:** O nás, Kontakt, Podmínky, Ochrana údajů, Cookies (ukázkové texty označené jako vzorové), cookie lišta jen pokud se používají neesenciální cookies (v MVP nepoužívat analytiku třetích stran).

## 5. Datová doména (slovník)

| Pojem | Hodnoty |
|---|---|
| Typ nabídky | `sale` (prodej), `rent` (pronájem) |
| Kategorie | `flat` byty, `house` domy, `land` pozemky, `commercial` komerční, `other` ostatní (garáže, parkovací stání, sklepy) |
| Dispozice (byty) | 1+kk, 1+1, 2+kk, 2+1, 3+kk, 3+1, 4+kk, 4+1, 5+kk, 5+1, 6 a více, atypický |
| Podtyp domu | rodinný, vila, chalupa, chata, zemědělská usedlost, řadový, dvojdomek |
| Podtyp komerčního | kancelář, obchod, sklad, výroba, restaurace, ordinace, činžovní dům |
| Typ stavby | cihlová, panelová, dřevostavba, kamenná, skeletová, smíšená, ostatní |
| Stav | novostavba, velmi dobrý, dobrý, po rekonstrukci, před rekonstrukcí, ve výstavbě, projekt, k demolici |
| Vlastnictví | osobní, družstevní, státní/obecní, ostatní |
| PENB | A, B, C, D, E, F, G (nebo neuvedeno) |
| Vybavení | balkon, terasa, lodžie, sklep, výtah, garáž, parkování, zahrada, bazén, bezbariérový, klimatizace, krb |
| Cena | celková / za měsíc / za m² a měsíc; příznaky *k jednání*, *cena na dotaz* |

## 6. Neúspěšné cesty, na které se nesmí zapomenout

Vypršená session uprostřed průvodce (koncept se neztratí) · nahrání poškozeného obrázku · duplicitní odeslání formuláře · inzerát smazaný při otevřeném detailu · oblíbený inzerát, který mezitím zmizel · prázdná DB · odpojená mapa/tiles (zobrazí se výpis a hláška) · pomalé připojení (skeletony) · e-mail neodešel (outbox s opakováním, chyba se zaloguje).
