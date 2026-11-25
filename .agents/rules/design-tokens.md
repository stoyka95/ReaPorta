# Pravidla pro UI a design

Zdroj pravdy je `DESIGN.md`. Tohle je zkrácená kontrolní verze, kterou máš mít na očích při psaní jakékoli komponenty.

- Hodnoty pouze z tokenů (`var(--…)` nebo Tailwind třídy mapované na tokeny). Žádné `#rrggbb`, `rgb()` s pevnými čísly ani `px` pro písmo, mezery, poloměry a stíny mimo `src/styles/tokens.css`.
- Barva: neutrální šedá + **jedna** fialová (`--accent`). Fialová jen pro hlavní akci, výběr a odkazy. `--violet-500` a světlejší nikdy jako barva textu.
- Písma: Fraunces jen pro `display`, `h1`–`h3` a velká čísla. Vše ostatní Inter. Ceny a čísla s `tabular-nums`.
- Sklo: `glass-1/2/3` jen na plovoucích prvcích (navigace, filtry, panely nad mapou, modály). Nikdy sklo ve skle. Vždy fallback pro `prefers-reduced-transparency` a prohlížeče bez `backdrop-filter`.
- Fotografie jsou hrdina; UI kolem nich je tiché. Text přes fotku jen se scrimem.
- Pohyb: jen `transform` a `opacity`, 120/200/320 ms, `--ease-out`. Respektuj `prefers-reduced-motion`.
- Cíle dotyku ≥ 44 px. Focus viditelný (`--focus-ring`, offset 2 px).
- Každá komponenta má stavy: výchozí, hover, active, focus-visible, disabled, loading, chyba, prázdný.
- Nová kombinace barev textu a pozadí: spočítej kontrast (≥ 4,5 : 1 pro běžný text).
- Texty jen z `messages/cs.json`, vykání, česká typografie (nezlomitelné mezery u cen a jednopísmenných předložek).
- Nepřidávej knihovnu na komponenty ani na vzhled bez zápisu do `docs/DECISIONS.md`.
- Co nedělat: viz `DESIGN.md` kap. 12.
