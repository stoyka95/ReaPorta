# BRAND.md — identita a logo ReaPorta

> Zpracováno dle `DESIGN.md` kap. 15 v etapě 2. Název značky **ReaPorta** (_Rea_ = reality, _porta_ = latinsky brána, dveře).

## 1. Hodnocení tří směrů

Kontaktní arch ve velikostech 16, 32, 64 a 128 px na čtyřech pozadích (světlé, sklo, fotka se scrimem, tmavé) je uložen v [`docs/screenshots/etapa-2/logo-contact-sheet.png`](screenshots/etapa-2/logo-contact-sheet.png). Nevybrané směry zůstávají archivovány v `public/brand/alternatives/`.

| Kritérium (1–5)           | A. Oblouk-brána (R) | **B. Oblouk + bod** | C. Skleněná dlaždice |
| ------------------------- | ------------------: | ------------------: | -------------------: |
| Rozpoznatelnost           |                   3 |               **5** |                    4 |
| Čitelnost v malém (16 px) |                   3 |               **5** |                    4 |
| Originalita (bez klišé)   |                   3 |               **5** |                    4 |
| Soulad s designem         |                   4 |               **5** |                    5 |
| Jednoduchost (1–2 tvary)  |                   3 |               **5** |                    4 |
| **Celkem (max. 25)**      |              **16** |              **25** |               **21** |

## 2. Výběr a zdůvodnění

Zvolili jsme **Směr B — Oblouk + bod** (`logo-mark.svg`). Znak tvoří pouhé dva čisté geometrické tvary: architektonický oblouk brány (_porta_) a středový kruhový bod, který současně odkazuje na světlo v okně domova i na bod polohy na mapě. Při 16 × 16 px zůstává silueta nezaměnitelná a nepřipomíná logo žádného známého realitního ani mapového portálu, přičemž se obejde bez klišé domečku se střechou, klíče či obecného špendlíku. Stejně spolehlivě funguje v plné fialové (`--violet-500` → `--violet-700`), čistě tmavé (`--gray-900`) i bílé variantě na skle, fotce se scrimem a tmavém pozadí. V horizontálním logu (`logo-full.svg`) se harmonicky spojuje se serifovou slovní značkou **ReaPorta** z fontu Fraunces SemiBold převedenou na vektorové křivky.

## 3. Soubory značky (`public/brand/`)

| Soubor                                                                           | Použití                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `logo-mark.svg`                                                                  | Barevný znak (mobilní navigace, avatar, značka)                       |
| `logo-full.svg`                                                                  | Plné vodorovné logo (navigace, patička, e-maily), wordmark v křivkách |
| `logo-mark-mono-dark.svg`, `logo-mark-mono-light.svg`                            | Jednobarevný znak (`#17171E`, `#FFFFFF`)                              |
| `logo-full-mono-dark.svg`, `logo-full-mono-light.svg`                            | Jednobarevné plné logo                                                |
| `favicon.svg`, `favicon.ico` (16/32/48 px)                                       | Ikona v záložce prohlížeče                                            |
| `apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`                  | Aplikační ikony (bílý znak na fialovém zaobleném čtverci)             |
| `og-default.png` (1200 × 630 px)                                                 | Výchozí obrázek pro sdílení na sociálních sítích                      |
| `alternatives/direction-a-arch-r.svg`, `alternatives/direction-c-glass-tile.svg` | Archiv nevybraných směrů                                              |

## 4. Pravidla použití

- **Ochranná zóna:** kolem loga ponechat volný prostor minimálně o šířce poloviny výšky znaku (`0.5×`).
- **Minimální velikost:** znak 16 × 16 px, plné logo 96 px na šířku.
- **V aplikaci:** výhradně přes komponenty `Logo` / `LogoMark` (`src/components/brand/`) a konfiguraci `BRAND` (`src/config/brand.ts`); v navigaci výška 32 px (desktop) / 28 px (mobil).
- **Zakázáno:** deformovat, otáčet, přidávat vržené stíny nebo měnit barvy mimo definované tokeny.
