# DESIGN.md — ReaPorta design systém

> Zdroj pravdy pro celý vzhled aplikace. Každá hodnota barvy, písma, mezery, poloměru, stínu a pohybu pochází odsud a do kódu se dostává **jen přes tokeny** (CSS proměnné + Tailwind theme). Žádné hex hodnoty ani pixelové konstanty v komponentách.
>
> Značka: **ReaPorta** (*Rea* = reality, *porta* = latinsky brána, dveře). Název a logo se berou z jednoho místa (`src/config/brand.ts`, `public/brand/`). Návrh loga viz kap. 15.

---

## 1. Vize

**Klidný, vzdušný, důvěryhodný, s osobností.** Světlé rozhraní ze skla a jemných přechodů. Neutrální šedá je základ, **jedna fialová** je akcent. Fotografie nemovitostí jsou hlavní hrdina, UI je tiché pozadí, které je nechá vyniknout. Osobnost nese jen typografie nadpisů (serif Fraunces) a drobné detaily (pohyb, stíny, mapové značky).

Pocit, který má mít uživatel: *"tohle je moderní, čistě udělané a můžu tomu věřit"*, ne *"tohle je další šablona"*.

### Inspirace (jen atmosféra, nic se nekopíruje)
| Zdroj | Co si z něj vzít |
|---|---|
| Airbnb | Jasná hierarchie karty inzerátu, velká fotka, rychlé oblíbené |
| Linear | Zdrženlivost, přesné mezery, jemné stavy |
| Apple (vizuál iOS/visionOS) | Skleněné panely, rozostření, měkké stíny |
| Editorial magazíny o bydlení | Velká serifová typografie, vzduch kolem obsahu |

Nekopíruj žádný skutečný web (ani logo, texty, ikony, rozvržení 1:1).

## 2. Principy

1. **Fotka je důležitější než chrome.** Okolní prvky nikdy nesoutěží s fotkou.
2. **Jedna akcentní barva, jedno primární tlačítko na pohled.** Fialová znamená "tady kliknout" nebo "tohle je vybrané".
3. **Sklo jen tam, kde plave nad něčím.** Navigace, filtry, plovoucí karty, panely nad mapou. Ne každá karta.
4. **Čitelnost je přednost před efektem.** Text na skle musí splnit kontrast na nejhorším pozadí.
5. **Pohyb vysvětluje, nezdobí.** Každá animace říká, co se změnilo.
6. **Čísla jsou zboží.** Cena, plocha, dispozice mají vlastní pečlivou typografii (tabulární číslice).

## 3. Tokeny

### 3.1 Barvy

**Neutrální šedá** (lehce chladná, ladí s fialovou):

| Token | Hex | Použití |
|---|---|---|
| `--gray-0` | `#FFFFFF` | karty, vstupy |
| `--gray-25` | `#FAFAFB` | jemné plochy |
| `--gray-50` | `#F4F4F6` | pozadí stránky |
| `--gray-100` | `#EBEBEF` | oddělovače, hover plochy |
| `--gray-200` | `#DDDDE3` | ohraničení vstupů |
| `--gray-300` | `#C5C5CF` | silnější ohraničení, disabled |
| `--gray-400` | `#9C9CAA` | **jen dekorace** (ikony), ne text |
| `--gray-500` | `#6A6A7A` | tlumený text (kontrast 5,3 : 1 na bílé, 4,8 : 1 na gray-50) |
| `--gray-600` | `#565665` | sekundární text |
| `--gray-700` | `#3E3E4B` | běžný text |
| `--gray-800` | `#272731` | silný text |
| `--gray-900` | `#17171E` | nadpisy |
| `--gray-950` | `#0E0E13` | téměř černá (tooltipy) |

**Fialový akcent:**

| Token | Hex | Použití |
|---|---|---|
| `--violet-50` | `#F7F4FF` | jemné zvýraznění |
| `--violet-100` | `#ECE6FF` | vybrané chipy, pozadí badge |
| `--violet-200` | `#DACEFF` | okraje vybraných prvků |
| `--violet-300` | `#C1AEFF` | dekorace, gradienty |
| `--violet-400` | `#A184FF` | dekorace, focus halo |
| `--violet-500` | `#8560F5` | jen dekorace a velké plochy (kontrast 4,2 : 1 na bílé, **nepoužívat pro text**) |
| `--violet-600` | `#6D3FE0` | **primární akcent**, tlačítka, odkazy (bílý text 6,1 : 1) |
| `--violet-700` | `#5B2FC2` | hover/active, text akcentu na světlém (8,0 : 1) |
| `--violet-800` | `#482699` | text na violet-100 (8,6 : 1) |
| `--violet-900` | `#331C6E` | nejtmavší akcent |

**Sémantické barvy** (stavy, vždy s ikonou a textem, nikdy jen barvou):

| Role | Text/ikona | Pozadí |
|---|---|---|
| success | `#1F7A52` | `#E6F4EC` |
| warning | `#9A5B00` | `#FFF3DC` |
| danger | `#C42B43` | `#FDE8EB` |
| info | `--violet-700` | `--violet-100` |

**Energetická třída PENB (A–G):** zobrazuje se jako **neutrální chip s barevnou tečkou**, ne jako barevný chip s textem (vyhneme se problémům s kontrastem):
`A #1F7A52 · B #5A9A3B · C #A3A82A · D #D4A017 · E #E07B1F · F #D4472B · G #B3263E`

**Sémantické role (to, co používají komponenty):**

```
--bg-page        gray-50       --text-strong   gray-900
--bg-surface     gray-0        --text          gray-700
--bg-subtle      gray-25       --text-muted    gray-500
--bg-hover       gray-100      --text-on-accent #FFFFFF
--border-subtle  gray-100      --accent        violet-600
--border         gray-200      --accent-hover  violet-700
--border-strong  gray-300      --accent-soft   violet-100
--focus-ring     violet-500    --accent-text   violet-700
```

### 3.2 Pozadí stránky ("aurora")

Pozadí stránky je `--gray-50` plus dva velmi jemné fialové rozptýlené přechody, na **samostatné fixní vrstvě** (`position: fixed; inset: 0; z-index: -1; pointer-events: none`), ne přes `background-attachment: fixed` (na mobilu je pomalé).

```css
.page-aurora {
  background:
    radial-gradient(60rem 40rem at 12% -10%, rgb(133 96 245 / .14), transparent 60%),
    radial-gradient(50rem 36rem at 96% 4%,  rgb(193 174 255 / .22), transparent 55%),
    radial-gradient(40rem 30rem at 50% 110%, rgb(218 206 255 / .30), transparent 60%),
    var(--gray-50);
}
```

Pravidla: žádný přechod není sytější než 0,3 průhlednosti. Žádné přechody v textu nadpisů. Přechod tlačítka je nejvýš 6 % rozdíl odstínu.

### 3.3 Sklo (glass)

Tři úrovně. Používej nejnižší, která stačí.

| Úroveň | Použití | Pozadí | Blur |
|---|---|---|---|
| `glass-1` | navigace, filtrační lišta | `rgb(255 255 255 / .62)` | 18 px |
| `glass-2` | plovoucí karty, panely nad mapou, kontaktní karta | `rgb(255 255 255 / .74)` | 24 px |
| `glass-3` | modály, drawery, lightbox ovládání | `rgb(255 255 255 / .86)` | 32 px |

Každý skleněný povrch má:
- `backdrop-filter: blur(var(--glass-blur)) saturate(160%)`
- vnější světlý okraj `1px solid rgb(255 255 255 / .72)`
- **jemný vnitřní tmavý okraj** (hairline) `0 0 0 1px rgb(23 23 30 / .06)` přes box-shadow
- vrstvený stín (viz 3.4)
- horní vnitřní odlesk `inset 0 1px 0 rgb(255 255 255 / .9)`

**Povinné fallbacky:**

```css
@supports not (backdrop-filter: blur(1px)) {
  .glass-1, .glass-2, .glass-3 { background: rgb(255 255 255 / .94); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass-1, .glass-2, .glass-3 { background: rgb(255 255 255 / .97); backdrop-filter: none; }
}
```

**Text na skle** musí mít kontrast ≥ 4,5 : 1 i nad nejtmavší částí fotky/mapy za ním. Nad fotkami se používá tmavý scrim (gradient `rgb(14 14 19 / .55)` → průhledná), ne sklo s textem.

### 3.4 Stíny (tónované do fialové, nikdy čistě černé)

```
--shadow-1: 0 1px 2px rgb(40 25 90 / .06), 0 1px 1px rgb(40 25 90 / .04);
--shadow-2: 0 2px 6px rgb(40 25 90 / .07), 0 8px 20px rgb(40 25 90 / .06);
--shadow-3: 0 4px 12px rgb(40 25 90 / .08), 0 16px 40px rgb(40 25 90 / .10);
--shadow-4: 0 8px 24px rgb(40 25 90 / .10), 0 32px 80px rgb(40 25 90 / .16);
--shadow-accent: 0 6px 18px rgb(109 63 224 / .32);   /* jen primární tlačítko */
```

### 3.5 Poloměry, mezery, vrstvy

```
Radius:  xs 6 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · pill 999 (px)
Spacing: základ 4 px → 0 1 2 3 4 5 6 8 10 12 16 20 24 32 (× 4 px)
Z-index: base 0 · sticky 20 · dropdown 40 · drawer 50 · modal 60 · toast 70 · tooltip 80
```
Vnořený poloměr = vnější poloměr − padding (karta `lg` s paddingem 8 má vnitřní obrázek `md`).

### 3.6 Pohyb

```
--dur-fast: 120ms   (hover, press)
--dur-base: 200ms   (dropdowny, chipy)
--dur-slow: 320ms   (panely, drawer, přechody stránek)
--ease-out: cubic-bezier(.2, .8, .2, 1)
--ease-in-out: cubic-bezier(.65, 0, .35, 1)
```
- Animuj jen `transform` a `opacity` (ne šířku/výšku/top/left).
- Seznam se při načtení nezobrazuje s efektem "postupné vyjíždění" delším než 40 ms/položku a max. 8 položek.
- `prefers-reduced-motion: reduce` → žádné posuny a škálování, jen krátké prolnutí (≤ 120 ms).

## 4. Typografie

### 4.1 Písma
| Role | Písmo | Poznámka |
|---|---|---|
| Nadpisy, velká čísla | **Fraunces** (variabilní) | váhy 500–600, `opsz` auto, `SOFT` 60, `WONK` 0, `letter-spacing: -0.02em` |
| Text, UI, ceny, formuláře | **Inter** (variabilní) | `font-feature-settings: "tnum" 1, "cv11" 1, "ss03" 1` u čísel |

Načítání přes `next/font/google` se `subsets: ['latin', 'latin-ext']` (**nutné pro české znaky**), `display: 'swap'`, výsledek do proměnných `--font-fraunces` a `--font-inter`. Před dokončením etapy 2 vykresli na `/dev/styleguide` větu *"Příliš žluťoučký kůň úpěl ďábelské ódy"* v obou písmech a ověř, že žádný znak nepadá do náhradního fontu.

### 4.2 Škála (fluidní)

| Styl | Písmo | Velikost | Řádek | Váha |
|---|---|---|---|---|
| `display` | Fraunces | `clamp(2.5rem, 1.6rem + 3.4vw, 4.25rem)` | 1.04 | 500 |
| `h1` | Fraunces | `clamp(2rem, 1.5rem + 2vw, 3rem)` | 1.1 | 500 |
| `h2` | Fraunces | `clamp(1.625rem, 1.3rem + 1.2vw, 2.25rem)` | 1.15 | 500 |
| `h3` | Fraunces | `1.5rem` | 1.25 | 600 |
| `h4` | Inter | `1.25rem` | 1.3 | 600 |
| `body-lg` | Inter | `1.125rem` | 1.6 | 400 |
| `body` | Inter | `1rem` | 1.6 | 400 |
| `small` | Inter | `.875rem` | 1.5 | 400/500 |
| `caption` | Inter | `.8125rem` | 1.4 | 500 |
| `price-xl` | Inter | `clamp(1.75rem, 1.4rem + 1.2vw, 2.5rem)` | 1.1 | 650, tnum |
| `price` | Inter | `1.25rem` | 1.2 | 650, tnum |
| `eyebrow` | Inter | `.75rem`, VELKÁ písmena, `letter-spacing: .08em` | 1.2 | 600 |

Pravidla: max. šířka odstavce `68ch`. Nadpisy nikdy nejsou menší než text pod nimi. Ceny: mezera mezi tisíci je **pevná nezlomitelná** (`5 990 000 Kč`, U+00A0), jednotka stejně tučná jako číslo, ale o stupeň menší (`Kč` 0,7 em). Čeština: žádné jednopísmenné předložky na konci řádku (použij `&nbsp;` po `k, s, v, z, o, u, a, i`).

## 5. Layout

- Kontejner: max. **1280 px**, boční padding 16 (mobil) / 24 (tablet) / 32 (desktop).
- Breakpointy: `sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.
- Mřížka: 4 sloupce (mobil), 8 (tablet), 12 (desktop), mezera 16/24.
- Vertikální rytmus sekcí: 64 px (mobil), 96 px (desktop).
- Navigace: sklo `glass-1`, výška 72 px (desktop) / 60 px (mobil), po scrollu se zmenší o 8 px a přidá se stín `shadow-1`.
- **Mobil první.** Dotykové plochy min. 44 × 44 px.

## 6. Komponenty

Všechny komponenty mají: výchozí, hover, active, focus-visible, disabled, loading (kde dává smysl), chybový stav. Stavy se ukazují na `/dev/styleguide`.

### Tlačítko
| Varianta | Vzhled |
|---|---|
| `primary` | plná `--accent`, bílý text, `shadow-accent`, vnitřní horní odlesk `inset 0 1px 0 rgb(255 255 255 / .25)`; hover `--accent-hover` + posun −1 px |
| `secondary` | sklo `glass-2`, text `--text-strong`, hairline okraj |
| `ghost` | průhledné, hover `--bg-hover` |
| `danger` | `--danger` text, světlé pozadí; plné červené jen v potvrzovacím dialogu |
| Velikosti | `sm` 36 · `md` 44 · `lg` 52 px výška; poloměr `md` (u `lg` `lg`); ikonové tlačítko je kruh |

Loading: spinner nahradí ikonu, text zůstane, šířka se nemění. Na jednom pohledu je max. jedno `primary` tlačítko.

### Vstupy
Výška 48 px, poloměr `md`, pozadí `--bg-surface`, okraj `--border`. Floating label **ne**; label je nad polem (`small`, `--text-strong`, 500). Focus: okraj `--violet-500` + halo `0 0 0 4px rgb(133 96 245 / .18)`. Chyba: okraj `--danger`, ikona + text pod polem. Pomocný text `--text-muted`.

### Chipy a segmentované ovládání
Chip: výška 36, pill, okraj `--border`; vybraný = pozadí `--violet-100`, okraj `--violet-200`, text `--violet-800`, ✓ ikona. Segmentované ovládání (Prodej | Pronájem) je skleněná pilulka s kluzným indikátorem (transform, 200 ms).

### Karta inzerátu (`ListingCard`)
```
┌───────────────────────────┐
│ [Nové] [Exkluzivně]    ♡  │  ← badge vlevo nahoře, oblíbené vpravo (glass kruh 40 px)
│        FOTKA 4:3          │  ← radius lg, scrim dole jen pokud jsou na fotce texty
│  ● ○ ○ ○ ○                │  ← tečky galerie (jen při hoveru, desktop)
├───────────────────────────┤
│ 5 990 000 Kč              │  ← price (Inter 650, tnum)
│ 76 790 Kč/m²              │  ← small, muted
│ Prodej bytu 3+kk · 78 m²  │  ← body, 500
│ ⌖ Praha 5 – Smíchov       │  ← small, muted, ikona pin
│ [Balkon] [Sklep] [Výtah]  │  ← mini chipy, max 3 + "+2"
└───────────────────────────┘
```
Karta: `--bg-surface`, radius `xl`, padding 8, `shadow-1`. Hover (desktop): `shadow-3`, posun −2 px, fotka `scale(1.03)` (320 ms). Celá karta je odkaz, srdce a tečky galerie jsou samostatné cíle. Skeleton má stejné rozměry (žádný layout shift). Horizontální varianta (výpis s mapou) má fotku vlevo 40 %.

### Skleněný panel (`GlassPanel`)
Prop `level: 1 | 2 | 3`, `padding`, `radius`. Nikdy nesmí obsahovat další `GlassPanel` (sklo ve skle = špína).

### Další
- **Dropdown/Popover/Dialog/Drawer:** Radix primitiva, vzhled `glass-3`, vstup animace 200 ms (opacity + translateY 6 px).
- **Rozsah ceny:** dvojitý slider s histogramem nabídek nad ním (sloupce `--violet-200`, vybraný rozsah `--violet-500`), pod ním dvě pole pro přesné zadání.
- **Badge:** výška 24, `caption`, radius pill. Varianty: `new` (violet-100/800), `exclusive` (gray-900 / bílý text), `reduced` (warning), `status` (success/warning/danger).
- **Toast:** vpravo dole (mobil dole uprostřed), `glass-3`, ikona stavu, automaticky mizí po 5 s, pozastaví se při hoveru.
- **Skeleton:** `--gray-100` s pomalým (1,6 s) jemným přeletem světla; vypnout při reduced motion.
- **Tabulka (admin):** hlavička `--bg-subtle`, řádky 56 px, hover `--bg-hover`, zebra ne, sticky hlavička.
- **Stepper (průvodce inzerátem):** vodorovný, kroky jako kruhy s číslem, aktivní `--accent`, hotové s ✓.
- **Dropzone:** čárkovaný okraj `--violet-300`, při tažení pozadí `--violet-50`, náhledy s přetahováním pořadí a označením úvodní fotky.
- **Avatar:** kruh 40/56/96, při chybějící fotce iniciály na `--violet-100`.
- **Prázdné stavy:** ilustrace jen z jednoduchých geometrických tvarů ve fialové a šedé (generované SVG), nadpis `h3`, jedna věta, jedna akce.

## 7. Rozvržení hlavních stránek

**Úvodní stránka**
1. Hero: `display` nadpis (např. *"Najděte místo, kterému budete říkat domov."*), pod ním velký skleněný vyhledávací panel (segment Prodej/Pronájem, kategorie, lokalita s našeptávačem, tlačítko *Hledat*). Pozadí aurora, v pravé části jemný jeden svislý "okenní" tvar s fotkou (radius 2xl) nebo abstraktní vrstvené skleněné karty. Žádné stocky s úsměvy.
2. Řada rychlých kategorií (Byty, Domy, Pozemky, Komerční, Ostatní) jako velké skleněné dlaždice s ikonou.
3. Nové a doporučené nabídky (karusel 4 karet).
4. Oblíbené lokality (mřížka dlaždic s fotkou města a počtem nabídek).
5. Pruh důvěry se 3 čísly (Fraunces velká čísla).
6. CTA pro makléře (velká skleněná plocha s přechodem violet-100 → bílá).
7. Patička.

**Výpis s mapou** (hlavní obrazovka)
- Pod navigací **sticky filtrační lišta** (`glass-1`): segment nabídky, kategorie, lokalita, cena, dispozice, tlačítko *Filtry* (počet aktivních filtrů v badge), uložit hledání.
- Desktop (≥ 1024): vlevo výpis 55 % (2 sloupce karet), vpravo **sticky mapa** 45 % (výška `100dvh − navigace − lišta`). Mapa a výpis se propojují (hover na kartě zvýrazní značku a naopak).
- Mobil: výpis na celou šířku, plovoucí skleněné tlačítko *Mapa* dole uprostřed otevře mapu přes celou obrazovku se spodním panelem (bottom sheet) s vybranou kartou.
- Hlavička výpisu: počet nabídek (`h2`), řazení, přepínač mřížka/seznam.
- Drawer *Další filtry* (vpravo, `glass-3`): sekce s nadpisy, sticky patička *Zobrazit 128 nabídek* + *Zrušit filtry*.

**Detail nabídky**
1. Galerie: mozaika (1 velká + 4 malé, radius `xl`), tlačítko *Zobrazit všech 24 fotek*. Lightbox přes celou obrazovku (tmavé pozadí `gray-950/.92`, ovládání `glass-3`, klávesnice ← → Esc, swipe).
2. Dva sloupce (desktop): vlevo obsah, vpravo **sticky kontaktní karta** (`glass-2`): avatar makléře, jméno, agentura, *Zobrazit telefon*, formulář, hlavní tlačítko.
3. Nad popisem pruh klíčových faktů (dispozice, plocha, patro, PENB chip, stav) jako 4–6 ikonových polí.
4. Sekce: popis, parametry (dvousloupcový seznam definic), vybavení (mřížka ikon), mapa (karta s radiusem `xl`), hypoteční kalkulačka, podobné nabídky.
5. Mobil: lepicí spodní lišta (`glass-3`) s cenou a tlačítky *Zavolat* / *Napsat*.

**Dashboard makléře a admin:** levý skleněný sidebar 264 px (sbalitelný na ikony), obsah na `--bg-page`, karty `--bg-surface`. Přehledové dlaždice (KPI) s velkým číslem ve Fraunces a drobným trendem. Tabulky podle 6.

**Formuláře a průvodce:** jeden sloupec max. 640 px, kroky se stepperem, sticky patička s *Zpět / Pokračovat*, uložení konceptu po každém kroku.

## 8. Mapa

- Knihovna MapLibre GL, styl světlý, tlumený (výchozí `positron`), aby fialové značky vynikly. Styl se čte z `NEXT_PUBLIC_MAP_STYLE_URL`.
- **Značka ceny:** pilulka `glass-3` s cenou ve zkráceném tvaru (`5,99 M`, `25 tis.`), `caption`, tabulární číslice; vybraná/hover = plná `--accent` s bílým textem a lehkým zvětšením. Navštívené = text `--gray-500`.
- **Shluk:** kruh `--violet-600` (alfa .9) s bílým číslem, poloměr roste s počtem (3 velikosti), okolo prstenec `rgb(133 96 245 / .25)`.
- **Ovládání:** skleněné kruhové tlačítka vpravo (zoom, moje poloha, celá obrazovka). Přepínač *Hledat při pohybu mapy* je skleněná pilulka nahoře uprostřed.
- Karta nabídky v mapě = zmenšená `ListingCard` v `glass-3`.

## 9. Obrázky, ikony, ilustrace

- Ikony: **Lucide**, tah 1,75 px, velikosti 16/20/24. Žádné emoji v UI.
- Fotky: poměr 4:3 (karty), 3:2 (galerie), `object-fit: cover`, `blurDataURL` placeholder, `sizes` nastavené správně, `next/image`. Úvodní fotka ve výpisu `priority` jen u prvních 2 karet.
- Alt texty generované: *"Obývací pokoj bytu 3+kk, Praha 5 – Smíchov, foto 3 z 12"* (makléř může upravit).
- Ilustrace: pouze generované geometrické SVG ve fialové a šedé. Žádné clipart a žádné stock lidi.

## 10. Stavy a mikrotexty

Oslovení **vykáním**, věcně, přátelsky, bez vykřičníků a bez omáčky.

| Situace | Text |
|---|---|
| Prázdný výpis | *Pro tyto parametry jsme nic nenašli.* + *Zkuste rozšířit lokalitu nebo upravit cenu.* + tlačítko *Zrušit filtry* |
| Prázdné oblíbené | *Zatím tu nic nemáte.* + *Srdíčkem si uložíte nabídky, ke kterým se chcete vrátit.* |
| Načítání | skeleton, žádný text |
| Chyba | *Něco se nepovedlo.* + *Zkuste to prosím znovu.* + tlačítko *Zkusit znovu* |
| Odesláno | *Zpráva je na cestě.* + *Makléř se vám ozve co nejdříve.* |
| Potvrzení smazání | *Smazat inzerát?* + *Tuto akci nelze vrátit zpět.* + *Smazat* / *Zrušit* |

Formát: `5 990 000 Kč`, `25 000 Kč/měsíc`, `78 m²`, `3+kk`, `2. patro z 5`, data `25. 11. 2026`.

## 11. Přístupnost (cíl WCAG 2.2 AA)

- Kontrast textu ≥ 4,5 : 1 (velký text a ikony nesoucí význam ≥ 3 : 1). Tabulka tokenů výše je prověřená; **před použitím nové kombinace spočítej kontrast**.
- Focus: viditelný vždy `outline: 2px solid var(--focus-ring); outline-offset: 2px` (u tmavých pozadí navíc bílý vnitřní kroužek).
- Vše ovladatelné klávesnicí, logické pořadí, Esc zavírá vrstvy, focus trap v modálech, návrat focusu.
- Sémantické HTML (`nav`, `main`, `section`, `h1` jen jeden), `aria-live` pro počet výsledků, `aria-pressed` u chipů a srdce.
- Cíle dotyku ≥ 44 px. Informace nikdy jen barvou.
- Mapa má textovou alternativu (výpis), značky jsou fokusovatelné.
- `prefers-reduced-motion` a `prefers-reduced-transparency` respektovány (viz výše).

## 12. Čemu se vyhnout ("AI-slop" seznam)

- Výchozí modrá z Tailwindu, náhodné duhové přechody, fialovo-růžové "AI" přechody v nadpisech.
- Sklo na všem, sklo ve skle, sklo bez pozadí, které by se mohlo rozmazat.
- Tři stejné karty s emoji ikonou nad nadpisem a větou.
- Stíny čistě černé, ostré okraje bez hairline, zaoblení všeho stejně.
- Lorem ipsum, "John Doe", stock fotky usmívajících se lidí.
- Zbytečné animace při načtení, parallax, plovoucí blobby.
- Text přes fotku bez scrimu.
- Hex hodnoty v komponentách (jen tokeny).

## 13. Vizuální QA (po každé etapě, která mění UI)

Agent pořídí snímky v rozlišeních **390×844, 768×1024, 1280×800, 1536×960** a ohodnotí je podle rubriky. Cíl: každé kritérium ≥ 4 z 5, jinak oprava před commitem.

| Kritérium | Otázka |
|---|---|
| Hierarchie | Je na první pohled jasné, co je nejdůležitější a kam kliknout? |
| Vzduch | Jsou mezery konzistentní (násobky 4 px) a dost velkorysé? |
| Typografie | Pracuje Fraunces jen v nadpisech? Jsou ceny tabulární a zarovnané? |
| Barva | Je fialová použita střídmě a jen pro akci/výběr? |
| Sklo | Je každé sklo čitelné a nad čím plave? Žádné sklo ve skle? |
| Fotky | Jsou fotky hrdinou? Žádné deformace, žádné skoky layoutu? |
| Stavy | Existují hover, focus, loading, prázdný, chybový stav? |
| Konzistence | Vypadá stejná komponenta všude stejně? |
| Responzivita | Nic nepřetéká, nic se nepřekrývá, dotykové plochy dost velké? |
| Detail | Stíny, okraje, odlesky, ikony: drží se pravidel? |

## 14. Kód tokenů

`src/styles/tokens.css` (jediné místo s hodnotami):

```css
:root {
  --gray-0:#FFFFFF; --gray-25:#FAFAFB; --gray-50:#F4F4F6; --gray-100:#EBEBEF;
  --gray-200:#DDDDE3; --gray-300:#C5C5CF; --gray-400:#9C9CAA; --gray-500:#6A6A7A;
  --gray-600:#565665; --gray-700:#3E3E4B; --gray-800:#272731; --gray-900:#17171E; --gray-950:#0E0E13;

  --violet-50:#F7F4FF; --violet-100:#ECE6FF; --violet-200:#DACEFF; --violet-300:#C1AEFF;
  --violet-400:#A184FF; --violet-500:#8560F5; --violet-600:#6D3FE0; --violet-700:#5B2FC2;
  --violet-800:#482699; --violet-900:#331C6E;

  --success:#1F7A52; --success-bg:#E6F4EC;
  --warning:#9A5B00; --warning-bg:#FFF3DC;
  --danger:#C42B43;  --danger-bg:#FDE8EB;

  --bg-page:var(--gray-50);   --bg-surface:var(--gray-0);  --bg-subtle:var(--gray-25); --bg-hover:var(--gray-100);
  --text-strong:var(--gray-900); --text:var(--gray-700); --text-muted:var(--gray-500); --text-on-accent:#FFFFFF;
  --border-subtle:var(--gray-100); --border:var(--gray-200); --border-strong:var(--gray-300);
  --accent:var(--violet-600); --accent-hover:var(--violet-700); --accent-soft:var(--violet-100);
  --accent-text:var(--violet-700); --focus-ring:var(--violet-500);

  --glass-1:rgb(255 255 255 / .62); --glass-2:rgb(255 255 255 / .74); --glass-3:rgb(255 255 255 / .86);
  --glass-border:rgb(255 255 255 / .72); --glass-hairline:rgb(23 23 30 / .06);
  --glass-blur-1:18px; --glass-blur-2:24px; --glass-blur-3:32px;

  --shadow-1:0 1px 2px rgb(40 25 90 / .06), 0 1px 1px rgb(40 25 90 / .04);
  --shadow-2:0 2px 6px rgb(40 25 90 / .07), 0 8px 20px rgb(40 25 90 / .06);
  --shadow-3:0 4px 12px rgb(40 25 90 / .08), 0 16px 40px rgb(40 25 90 / .10);
  --shadow-4:0 8px 24px rgb(40 25 90 / .10), 0 32px 80px rgb(40 25 90 / .16);
  --shadow-accent:0 6px 18px rgb(109 63 224 / .32);

  --radius-xs:6px; --radius-sm:8px; --radius-md:12px; --radius-lg:16px;
  --radius-xl:24px; --radius-2xl:32px; --radius-pill:999px;

  --dur-fast:120ms; --dur-base:200ms; --dur-slow:320ms;
  --ease-out:cubic-bezier(.2,.8,.2,1); --ease-in-out:cubic-bezier(.65,0,.35,1);
}
```

`src/app/globals.css` (Tailwind v4, mapování tokenů do utilit):

```css
@import "tailwindcss";
@import "../styles/tokens.css";

@theme inline {
  --color-page: var(--bg-page);
  --color-surface: var(--bg-surface);
  --color-subtle: var(--bg-subtle);
  --color-strong: var(--text-strong);
  --color-body: var(--text);
  --color-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-soft: var(--accent-soft);
  --color-line: var(--border);
  --color-danger: var(--danger);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --shadow-card: var(--shadow-1);
  --shadow-float: var(--shadow-3);
  --ease-out: var(--ease-out);
}

@layer components {
  .glass-1 { background: var(--glass-1); backdrop-filter: blur(var(--glass-blur-1)) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: 0 0 0 1px var(--glass-hairline), inset 0 1px 0 rgb(255 255 255 / .9), var(--shadow-2); }
  .glass-2 { background: var(--glass-2); backdrop-filter: blur(var(--glass-blur-2)) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: 0 0 0 1px var(--glass-hairline), inset 0 1px 0 rgb(255 255 255 / .9), var(--shadow-3); }
  .glass-3 { background: var(--glass-3); backdrop-filter: blur(var(--glass-blur-3)) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: 0 0 0 1px var(--glass-hairline), inset 0 1px 0 rgb(255 255 255 / .9), var(--shadow-4); }
}
```

Pravidlo pro kód: pokud token chybí, **přidej ho sem** (s odůvodněním v commitu), nepiš hodnotu přímo do komponenty.

## 15. Logo a značka

**Název:** ReaPorta. *Rea* odkazuje na reality, *porta* je latinsky brána, dveře: místo, kterým se vstupuje domů. To je hlavní myšlenka, ze které logo vychází.

### Zadání pro logo
Navrhni logo, které je **jednoduché, zapamatovatelné a vypadá drahé**. Hodí se k světlému skleněnému designu, fialovému akcentu a serifovému písmu Fraunces.

**Tři směry (vytvoř všechny tři jako SVG, pak vyber jeden):**
| Směr | Myšlenka |
|---|---|
| A. **Oblouk-brána** | Monogram **R**, jehož otevřená část (counter) tvoří klenutý vchod. Brána = *porta*. |
| B. **Oblouk + bod** | Klenutý vchod s malým kruhem uvnitř (bod na mapě i světlo v okně). Reality + poloha. |
| C. **Skleněná dlaždice** | Zaoblený čtverec ve stylu aplikační ikony s klenutým výřezem a jemným přechodem fialové. Přímo vychází z designu "glass". |

**Pravidla pro všechny směry:**
- Znak (mark) tvoří **jedna až dvě základní geometrické tvary** (oblouk, kruh, zaoblený čtverec). Žádné drobné detaily.
- Funguje v **jedné barvě** (čistě černá, čistě bílá, `--violet-600`) a čte se v 16 × 16 px (favicon).
- Barvy jen z palety: `--violet-600` jako hlavní, `--gray-900` pro text, volitelně jemný přechod `--violet-500` → `--violet-700` ve znaku (ne v textu).
- **Žádné klišé:** obrys domečku se střechou, klíč, obecná špendlíková značka, lupa, náhodné "AI" jiskry.
- **Nekopíruj** a ani se nepřibližuj logu žádného existujícího realitního ani jiného portálu. Před výběrem proveď kontrolu: znak by nesměl při pohledu na 16 px připomínat známé logo.
- Logo musí vypadat dobře na světlém pozadí, na skle (`glass-1`), na fotce se scrimem a na tmavém pozadí (`--gray-900`).

### Slovní značka (wordmark)
- Text **ReaPorta** (jedno slovo, velké R a P), Fraunces váha 600, `letter-spacing: -0.02em`.
- Doporučená varianta: celé slovo `--gray-900`, ve znaku fialová. Alternativa: "Rea" v `--gray-900` a "Porta" v `--violet-700`, pokud obstojí kontrast.
- Text ve finálních SVG **převeď na křivky** (z fontu Fraunces, např. přes `fonttools` nebo `opentype.js`), aby logo nezáviselo na načtení fontu. Zdrojový font je licencovaný pod SIL OFL.

### Varianty a soubory (`public/brand/`)
| Soubor | Použití |
|---|---|
| `logo-mark.svg` | samotný znak (navigace na mobilu, avatar, ikona) |
| `logo-full.svg` | znak + slovní značka vodorovně (navigace, patička, e-maily) |
| `logo-mark-mono-dark.svg`, `logo-mark-mono-light.svg` | jednobarevné verze |
| `logo-full-mono-dark.svg`, `logo-full-mono-light.svg` | jednobarevné verze |
| `favicon.svg` + `favicon.ico` (16/32/48) | záložka |
| `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` | mobilní ikony (znak na `--violet-600` nebo `--gray-0` s okrajem) |
| `og-default.png` (1200×630) | výchozí sdílený obrázek (aurora pozadí, logo, claim) |
| `alternatives/` | zbývající dva nevybrané směry |

Do kódu patří komponenty `Logo` a `LogoMark` (`src/components/brand`), které berou barvy z tokenů (`currentColor`) a mají prop `variant: 'full' | 'mark'`. Navigace: výška loga 32 px (desktop) / 28 px (mobil), znak a text jsou jeden odkaz na `/`, `aria-label="ReaPorta, úvodní stránka"`.

### Ochranná zóna a minimální velikost
- Volný prostor kolem loga je alespoň **polovina výšky znaku**.
- Minimální velikost: znak 16 px, plné logo 96 px na šířku.
- Nedeformovat, neotáčet, nepřidávat stíny ani efekty (výjimka: jemný přechod uvnitř znaku popsaný výše).

### Postup (povinný, zapsat do `docs/BRAND.md`)
1. Vytvoř 3 směry jako samostatné SVG (ručně psané cesty, žádné trasování rastru).
2. Vykresli kontaktní arch: každý směr ve velikostech 16, 32, 64, 256 px na čtyřech pozadích (světlé, sklo, fotka, tmavé).
3. Ohodnoť podle kritérií (1–5): **rozpoznatelnost, čitelnost v malém, originalita, soulad s designem, jednoduchost**. Vyber nejlepší směr a zdůvodni ho v `docs/BRAND.md` (3–5 vět).
4. Dopracuj vybraný směr (optická korekce, zarovnání na mřížku, kontrola křivek), vytvoř všechny soubory z tabulky, vlož do navigace, patičky, favicon a e-mailů.
5. Přidej logo na `/dev/styleguide` (všechny varianty a pozadí).
