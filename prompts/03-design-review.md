# Prompt: vizuální revize a úpravy designu

> Použij, když se ti výsledek vzhledově nelíbí nebo chceš změnit směr. Nejdřív uprav `DESIGN.md` (barvy, písma, pravidla), pak vlož tento prompt.

```
Proveď vizuální revizi aplikace podle DESIGN.md (kap. 13) a oprav nedostatky.

1. Spusť aplikaci a projdi tyto stránky: /, výpis s mapou (/prodej/byty/praha),
   detail nabídky, přihlášení, /dev/styleguide a (pokud existují) dashboard a admin.
2. Pro každou stránku pořiď snímky v šířkách 390, 768, 1280 a 1536 px.
3. Ohodnoť každou stránku podle rubriky (hierarchie, vzduch, typografie, barva, sklo, fotky,
   stavy, konzistence, responzivita, detail) známkou 1–5 a napiš konkrétní problémy
   (např. "karta v mřížce má jiný vnitřní padding než v detailu podobných nabídek").
4. Opravuj od nejhorších známek. Měň jen tokeny, komponenty a styly; neměň funkčnost.
5. Po opravách pořiď nové snímky a ohodnoť znovu. Cíl: všude ≥ 4. Pokud ne, opakuj (max. 3 kola).
6. Spusť pnpm check:tokens, pnpm typecheck, pnpm lint, pnpm test a axe testy.
7. Výsledek: tabulka "před/po" se známkami, seznam změn, snímky do docs/screenshots/revize-<datum>/.
   Commit "design: revize <datum>" a záznam v docs/STAGE_LOG.md.

Nepřidávej nové knihovny pro vzhled, nevymýšlej novou paletu ani jiná písma a nekopíruj žádný
existující web.
```

## Tipy pro lepší výsledek

- Přilož do konverzace 2–3 snímky obrazovek, které se ti líbí ("tahle jemnost stínů", "takhle velká typografie"), a napiš, **co přesně** se ti na nich líbí. Agent ze snímku lépe čte konkrétní detail než celkový dojem.
- Zadávej po jedné stránce: *"Zpracuj jen úvodní hero, ostatní nech."* Dává to lepší výsledky než "udělej vše hezčí".
- Když se ti něco nelíbí, napiš proč jednou větou ("moc zaoblené", "sklo je nečitelné nad fotkou", "fialová je všude"). Ze zadání *"nelíbí se mi to"* agent nic nevyčte.
