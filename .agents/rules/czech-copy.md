# Pravidla pro české texty a formáty

- Oslovení **vykáním**, věcný a přátelský tón, bez vykřičníků a marketingové omáčky.
- Správné pády a množná čísla přes `Intl.PluralRules('cs')`:
  `1 nabídka · 2–4 nabídky · 5+ nabídek · 0 nabídek` (zlomky: *1,5 nabídky*).
- Formáty:
  - cena `5 990 000 Kč`, pronájem `25 000 Kč/měsíc`, za m² `76 790 Kč/m²` (nezlomitelné mezery U+00A0, `Intl.NumberFormat('cs-CZ')`)
  - plocha `78 m²`, dispozice `3+kk`, patro `2. patro z 5`
  - datum `25. 11. 2026`, relativní čas `před 3 dny`
  - zkrácená cena na mapě `5,99 M`, `25 tis.`
- Jednopísmenné předložky a spojky (*k, s, v, z, o, u, a, i*) nesmí zůstat na konci řádku (`&nbsp;`), funkce `nbsp()` v `src/lib/format`.
- Chybové hlášky formulářů konkrétní a lidské: *"Zadejte prosím platný e-mail."*, ne *"Invalid input"*.
- Slugy a URL bez diakritiky a bez velkých písmen (`praha-smichov`), převod knihovní funkcí `slugify` s testy na `ěščřžýáíéúůďťň`.
- Řazení českých řetězců přes `Intl.Collator('cs')` (ch za h).
- E-maily: předmět do 60 znaků, česky, s textovou variantou.
- Texty ukládej do `messages/cs.json`; v komponentách žádné pevné české řetězce.
