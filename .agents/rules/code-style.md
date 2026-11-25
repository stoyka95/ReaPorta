# Pravidla pro kód

- TypeScript `strict`. Žádné `any`, `as unknown as`, `@ts-ignore` bez komentáře a zápisu do `docs/DECISIONS.md`.
- Pojmenování: komponenty `PascalCase`, soubory komponent `PascalCase.tsx`, ostatní `kebab-case.ts`, funkce `camelCase`, typy `PascalCase`, konstanty `UPPER_SNAKE_CASE` jen pro skutečné konstanty.
- Stránky v `src/app` jsou tenké; logika patří do `src/features` a `src/lib`. Dotazy do DB jen v `src/db/queries`.
- Server komponenty jako výchozí. `"use client"` jen tam, kde je interaktivita (filtry, mapa, galerie, formuláře).
- Všechny vstupy ze sítě validuj Zod schématem na serveru, i když je validuješ na klientu.
- Mutace = Server Action nebo route handler s pořadím: session → role/vlastnictví → Zod → akce → audit → revalidace.
- Chyby: žádné prázdné `catch`. Uživateli česká hláška, do logu technický detail bez osobních údajů.
- Funkce krátké a s jedním účelem; soubor nad ~300 řádků rozděl. Komentáře vysvětlují *proč*, ne *co*.
- Žádný mrtvý kód, žádná zakomentovaná řešení, žádné `console.log` v commitech (použij logger z `src/lib/log.ts`).
- Přístupnost: sémantické prvky (`button`, `a`, `nav`, `main`), `label` ke každému poli, `alt` u obrázků, `aria-*` jen tam, kde nativní prvek nestačí.
- Testy: každá nová logika v `lib/` a `features/` má Vitest test; každý uživatelský tok z `docs/QA-CHECKLIST.md` má Playwright scénář, jakmile je hotový.
- Commity malé a pojmenované `etapa N: popis (AC-x.y)`. Před commitem `pnpm typecheck && pnpm lint && pnpm test`.
