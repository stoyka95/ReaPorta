# ARCHITECTURE.md — technické řešení

> Rozhodnutí jsou závazná. Pokud je něco potřeba změnit, zapiš důvod do `docs/DECISIONS.md` a pokračuj; neptej se a nečekej.

## 1. Stack

| Oblast | Volba |
|---|---|
| Runtime | Node.js 22 LTS, **pnpm** |
| Framework | **Next.js** (poslední stabilní verze, App Router, TypeScript `strict`) |
| Databáze | **PostgreSQL 16+ lokálně** (bez Supabase, bez cloudu). Jen rozšíření z `contrib`: `pg_trgm`, `unaccent`, `citext`. **PostGIS se nepoužívá.** |
| ORM a migrace | **Drizzle ORM** + `drizzle-kit` (SQL migrace v `drizzle/`) |
| Validace | **Zod** (sdílená schémata klient/server) |
| Autentizace | **Better Auth** (e-mail + heslo, ověření e-mailu, session v PostgreSQL, Drizzle adapter). Záložní plán při blokaci: Auth.js s JWT session |
| Styly | **Tailwind CSS v4** + tokeny z `DESIGN.md` |
| UI primitiva | **Radix UI** (bez stylů) + vlastní komponenty v `src/components/ui` |
| Ikony | `lucide-react` |
| Animace | `motion` (jen transform/opacity), jinak CSS |
| Formuláře | `react-hook-form` + `@hookform/resolvers/zod` |
| Stav v URL | `nuqs` (filtry výpisu) |
| Mapa | `maplibre-gl` + `supercluster`; styl z `NEXT_PUBLIC_MAP_STYLE_URL` (výchozí `https://tiles.openfreemap.org/styles/positron`, bez klíče; ověř, že odpovídá, jinak zapiš do DECISIONS a zvol jiný bezklíčový styl) |
| Obrázky | `sharp` (varianty WebP, blur placeholder), úložiště na disku za rozhraním `StorageProvider` |
| E-maily | šablony `react-email`; v dev odeslání přes **Mailpit** (SMTP 1025, UI 8025) nebo do tabulky `email_outbox`; v produkci později Resend |
| i18n | `next-intl`, jediný jazyk `cs`, texty v `messages/cs.json` |
| Testy | **Vitest** (jednotkové/integrační), **Playwright** (E2E + axe pro přístupnost) |
| Kvalita | ESLint, Prettier, `tsc --noEmit`, `lint-staged` + Husky (pre-commit: typecheck + lint změněných souborů) |
| Seed | `@faker-js/faker` (`cs` locale) + ručně psané šablony českých popisů |

## 2. Struktura repozitáře

```
reaporta/
├── AGENTS.md  GEMINI.md  DESIGN.md  README.md
├── docs/            SPEC · ARCHITECTURE · PLAN · QA-CHECKLIST · SEED-DATA · OPEN-QUESTIONS · DECISIONS · STAGE_LOG
├── prompts/         kickoff prompty pro Antigravity
├── .agents/         rules/ a workflows/ pro Antigravity
├── drizzle/         generované SQL migrace
├── messages/cs.json texty UI
├── public/
├── storage/         nahrané soubory (v .gitignore)
├── scripts/         seed.ts · job-alerts.ts · generate-placeholder-photos.ts · check-tokens.ts
├── e2e/             Playwright testy
└── src/
    ├── app/
    │   ├── (public)/        úvod, výpisy, detail, makléři, agentury, právní
    │   ├── (auth)/          přihlášení, registrace, reset hesla
    │   ├── ucet/            profil, oblíbené, hledání
    │   ├── dashboard/       makléř
    │   ├── admin/
    │   ├── api/             route handlery (search, suggest, upload, health…)
    │   ├── dev/styleguide/  jen v dev
    │   ├── sitemap.ts  robots.ts  not-found.tsx  error.tsx
    ├── components/
    │   ├── ui/              primitiva (Button, Input, GlassPanel…)
    │   ├── listing/         ListingCard, Gallery, Facts, ContactCard…
    │   ├── search/          FilterBar, FilterDrawer, ResultsList
    │   ├── map/             MapView, PricePin, ClusterPin
    │   └── layout/          Navbar, Footer, DashboardShell
    ├── db/                  schema.ts, client.ts, queries/ (jedna funkce = jeden dotaz)
    ├── lib/                 auth, search (builder), geo, format (cs), slug, email, storage, rate-limit, env
    ├── features/            doménová logika po modulech (actions, schemas, services)
    ├── styles/tokens.css
    └── config/brand.ts
```

Pravidla: stránky (`app/`) jsou tenké; logika je ve `features/` a `lib/`. Dotazy do DB **pouze** přes `src/db/queries`. Žádný import z `features/x` do `features/y` (jen přes `lib/`).

## 3. Prostředí a spuštění

`.env.example` (v repu): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_MAP_STYLE_URL`, `SMTP_HOST/PORT`, `MAIL_FROM`, `STORAGE_DIR`, `CRON_SECRET`, `GEOCODER` (`none`|`nominatim`|`mapycz`) a `MAPYCZ_API_KEY` (volitelně).

Skripty `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`, `db:reset` (drop + migrate + seed), `job:alerts`, `photos:generate`, `check:tokens`.

`docker-compose.yml` (volitelný) spouští PostgreSQL 16 a Mailpit. Pokud uživatel má lokální PostgreSQL, stačí `DATABASE_URL`. Skripty musí fungovat v obou případech. `db:reset` nikdy nesmí běžet proti databázi, jejíž název neobsahuje `dev` nebo `test` (pojistka).

## 4. Databázové schéma (jádro)

Názvy tabulek množné číslo, `snake_case`, primární klíče `uuid` (`gen_random_uuid()`), časy `timestamptz`. Drizzle schéma musí odpovídat.

```
users            id, email (citext unique), email_verified_at, name, phone, avatar_key,
                 role enum('user','agent','admin'), blocked_at, created_at, updated_at, deleted_at
(+ tabulky Better Auth: sessions, accounts, verifications)

agencies         id, name, slug unique, logo_key, description, website, email, phone, address, created_at
agent_profiles   user_id pk→users, agency_id→agencies null, display_name, slug unique, bio, photo_key,
                 phone_public, email_public, languages text[], verified_at

locations        id serial pk, parent_id→locations, type enum('kraj','okres','obec','cast'),
                 name, slug, full_slug unique, lat, lng, population, listing_count_cache
                 INDEX gin (unaccent(lower(name)) gin_trgm_ops), INDEX (parent_id), INDEX (type)

listings         id, slug unique, agent_id→users, agency_id→agencies null,
                 status enum('draft','pending','active','paused','sold','rejected','expired'),
                 reject_reason, offer_type enum('sale','rent'),
                 category enum('flat','house','land','commercial','other'), subtype text,
                 title, description,
                 price numeric(12,0) null, price_unit enum('total','per_month','per_m2_month'),
                 price_negotiable bool, price_on_request bool, fees_monthly numeric(10,0), deposit numeric(12,0),
                 street, house_number, zip, location_id→locations (nejpřesnější úroveň), city text, district text,
                 lat double precision, lng double precision, show_exact_location bool default false,
                 usable_area numeric(8,1), land_area numeric(10,1), built_area numeric(8,1),
                 floor int, floors_total int, year_built int, last_renovation int,
                 disposition enum(...), building_type enum(...), condition enum(...), ownership enum(...),
                 energy_class enum('A'..'G') null, furnished enum('yes','partly','no') null,
                 amenities text[] (GIN index), available_from date,
                 price_per_m2 numeric generated (price / usable_area) — jen u prodeje,
                 views_count int, favorites_count int,
                 published_at, expires_at, created_at, updated_at,
                 search_text tsvector (aktualizovaný triggerem z title, description, city, district, street; konfigurace 'simple' + unaccent)
                 INDEXY: (status, offer_type, category, published_at desc), (price), (usable_area), (location_id),
                         (lat, lng), GIN(amenities), GIN(search_text)

listing_images   id, listing_id→listings on delete cascade, storage_key, width, height,
                 blur_data_url text, alt, sort_order int, is_cover bool
listing_price_history  id, listing_id, price, changed_at

favorites        user_id, listing_id, created_at   PK(user_id, listing_id)
saved_searches   id, user_id, name, params jsonb, frequency enum('instant','daily','weekly','off'),
                 last_notified_at, created_at
inquiries        id, listing_id, agent_id, user_id null, name, email, phone, message,
                 status enum('new','read','replied','archived'), ip_hash, created_at
reports          id, listing_id, reporter_user_id null, reason enum('fraud','duplicate','wrong_info','sold','other'),
                 details, status enum('open','resolved','dismissed'), resolved_by, created_at
listing_daily_stats  listing_id, day date, views int, phone_reveals int   PK(listing_id, day)
email_outbox     id, to_email, subject, html, text, status enum('queued','sent','failed'), attempts int, error, created_at, sent_at
audit_log        id, actor_id, action text, entity text, entity_id text, meta jsonb, created_at
rate_limits      key text pk, count int, reset_at   (jednoduchý limiter v DB; stačí pro MVP)
```

**Pravidla:** `slug` inzerátu = `kategorie-dispozice-lokalita-plocha-xxxxxx` (6 znaků náhodně), bez diakritiky. Soft delete jen u `users`; inzeráty se mažou natvrdo včetně souborů. Žádná osobní data v logu.

## 5. Vyhledávání

- **Builder dotazu** (`src/lib/search/build-query.ts`): přijme ověřený objekt filtrů (Zod), vrátí Drizzle dotaz. Žádné skládání SQL řetězců z uživatelského vstupu.
- **Fulltext:** `search_text @@ websearch_to_tsquery('simple', unaccent($q))` + doplněk trigramů pro překlepy v lokalitách.
- **Lokalita:** výběr obce zahrnuje její části; výběr okresu/kraje zahrnuje potomky (rekurzivně přes `full_slug LIKE 'kraj/okres/%'`).
- **Mapa:** endpoint `GET /api/search/map?<filtry>&bbox=w,s,e,n` vrací max. 2000 lehkých bodů `{id, lat, lng, price, category, offer}`; shlukování na klientu (`supercluster`). Výpis a mapa sdílejí **stejný builder**.
- **Autosuggest:** `GET /api/locations/suggest?q=` (max. 8), řazení: přesná shoda začátku > trigram podobnost > populace.
- **Počet výsledků:** `count(*)` se stejnými filtry; pro bezfiltrové dotazy cache 60 s.
- **Výkon:** `EXPLAIN ANALYZE` hlavních dotazů uložit do `docs/PERF.md` (etapa 11). Hledání nad 10 000 řádky ≤ 300 ms.

## 6. Routy

| URL | Obsah |
|---|---|
| `/` | úvod |
| `/prodej/[kategorie]` · `/prodej/[kategorie]/[...lokalita]` | výpis (stejně `/pronajem/...`); `kategorie`: `byty`, `domy`, `pozemky`, `komercni`, `ostatni`, `vse` |
| `/nemovitost/[slug]` | detail |
| `/makleri` · `/makleri/[slug]` · `/agentury/[slug]` | makléři, agentury |
| `/prihlaseni` · `/registrace` · `/zapomenute-heslo` · `/obnova-hesla` · `/overeni-emailu` | autentizace |
| `/ucet` · `/ucet/oblibene` · `/ucet/hledani` | účet |
| `/inzerce` | landing pro makléře |
| `/dashboard` · `/dashboard/inzeraty` · `/dashboard/inzeraty/novy` · `/dashboard/inzeraty/[id]/upravit` · `/dashboard/poptavky` · `/dashboard/statistiky` · `/dashboard/profil` | makléř |
| `/admin` · `/admin/moderace` · `/admin/uzivatele` · `/admin/agentury` · `/admin/nahlaseni` · `/admin/lokality` | admin |
| `/o-nas` · `/kontakt` · `/podminky` · `/ochrana-udaju` · `/cookies` | právní a informační |
| `/dev/styleguide` | jen mimo produkci |
| `/api/...` | `search`, `search/map`, `locations/suggest`, `upload`, `listings/[id]/phone`, `inquiries`, `reports`, `cron/alerts` (chráněno `CRON_SECRET`), `health` |

Mutace dělej přes **Server Actions** (formuláře) a route handlery (mapa, upload, odhalení telefonu). Každá mutace: ověření session → ověření role/vlastnictví → Zod → akce → audit (u admin) → `revalidatePath/Tag`.

## 7. Autentizace a oprávnění

- Hesla argon2id (ověřit, že to Better Auth umí; jinak `@node-rs/argon2` s vlastním hasherem).
- Role v `users.role`. Middleware chrání `/ucet`, `/dashboard`, `/admin` (přesměrování na přihlášení s `?next=`). **Skutečná kontrola oprávnění je vždy také v server action/query**, ne jen v middleware.
- Helper `requireUser()`, `requireAgent()`, `requireAdmin()`, `assertOwnsListing(listingId)`.
- Zablokovaný uživatel (`blocked_at`) se nemůže přihlásit ani odesílat poptávky.

## 8. Obrázky a soubory

- Upload: `POST /api/upload` (multipart, stream), ověření session a vlastnictví inzerátu, max. 12 MB/ks, kontrola **magic bytes** (ne jen přípony a MIME), `sharp` zpracování: otočení dle EXIF, **odstranění EXIF/GPS**, varianty `thumb 320`, `card 640`, `full 1600` šířky v WebP, `blur_data_url` 16 px.
- Soubory v `storage/` pod `listings/<id>/<uuid>-<variant>.webp`; servíruje je route handler `/media/[...key]` s dlouhým cachováním; klíče nejsou uhodnutelné cesty k jiným souborům (validace `..`).
- `StorageProvider` rozhraní (`put`, `delete`, `url`) → pozdější záměna za S3 bez změny zbytku.

## 9. E-maily a úlohy

- `sendEmail()` zapíše do `email_outbox` a pokusí se odeslat (SMTP/Mailpit); selhání → `failed` + opakování příkazem `pnpm job:outbox`.
- Šablony (react-email, ve stylu značky): ověření e-mailu, reset hesla, nová poptávka (makléři), potvrzení poptávky (zájemci), výsledek moderace, upozornění na nové nabídky.
- `pnpm job:alerts`: pro každé `saved_search` (frekvence dle `last_notified_at`) spustí builder s parametry + `published_at > last_notified_at`, max. 10 nabídek v e-mailu, pak aktualizuje `last_notified_at`. Idempotentní. Stejnou logiku vystavuje `/api/cron/alerts` (hlavička `Authorization: Bearer $CRON_SECRET`).
- `pnpm job:expire`: nastaví `expired` u inzerátů po `expires_at`.

## 10. Výkon a cache

- Veřejné stránky jako server komponenty; interaktivní části (filtry, mapa, galerie) jako klientské ostrůvky.
- `next/image` s lokálními variantami, `priority` jen nad ohybem, `sizes` vždy.
- Mapa se načítá dynamicky (`next/dynamic`, `ssr: false`) až po viditelnosti; `maplibre-gl` mimo hlavní bundle úvodní stránky.
- Úvodní stránka a detail: `revalidate` (ISR) 60 s + `revalidateTag` při změně inzerátu.
- Rozpočty: JS úvodní stránky ≤ 180 kB gzip, výpis ≤ 260 kB (bez mapy), CLS ≤ 0,05.

## 11. Bezpečnost

| Hrozba | Opatření |
|---|---|
| SQL injection | jen Drizzle parametrizované dotazy; žádné `sql.raw` s uživatelským vstupem |
| XSS | React escapuje; popis inzerátu je **čistý text** (odstavce), žádné `dangerouslySetInnerHTML` z uživatelských dat; CSP hlavička |
| CSRF | Server Actions (origin check) + SameSite cookies; route handlery s mutací kontrolují `Origin` |
| IDOR | `assertOwnsListing`, testy: makléř A nesmí číst/měnit data makléře B |
| Upload | magic bytes, limity, re-enkódování `sharp`, žádné spouštění nahraných souborů |
| Brute force a spam | `rate_limits` na přihlášení, registraci, poptávky, odhalení telefonu, reset hesla |
| Únik dat | e-mail a telefon makléře jen přes akce; telefon není v HTML před odhalením; IP se ukládá jen jako hash |
| Hlavičky | `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (produkce) |
| Tajemství | nikdy v repu; `.env` v `.gitignore`; kontrola `pnpm check:secrets` (grep na typické klíče) |
| Závislosti | `pnpm audit` v etapě 11, nové závislosti zdůvodnit v `DECISIONS.md` |

## 12. Testování

- **Vitest:** builder vyhledávání (každý filtr), formátovače (`cs`), hypoteční kalkulačka, slugy, rate limiter, autorizační helpery. Cíl: pokrytí logiky v `lib/` a `features/` ≥ 80 %.
- **Integrační testy** proti testovací DB `reaporta_test` (migrace + minimální seed, každý test v transakci nebo čistá DB).
- **Playwright:** scénáře z `QA-CHECKLIST.md` (kritické cesty) + `@axe-core/playwright` na úvodu, výpisu, detailu, přihlášení, průvodci a dashboardu.
- **Vizuální kontrola:** snímky ve 4 rozlišeních (viz `DESIGN.md` kap. 13) ukládat do `docs/screenshots/<etapa>/`.
