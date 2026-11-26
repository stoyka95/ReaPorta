# DEPLOY.md — Návod pro produkční nasazení ReaPorta

> Tento dokument slouží jako technický průvodce a checklist pro nasazení aplikace **ReaPorta** do produkčního prostředí (VPS / Docker / PaaS + spravovaný PostgreSQL). V rámci lokálního MVP se nic nenasazuje.

---

## 1. Požadavky na produkční infrastrukturu

| Komponenta                   | Minimální verze / požadavek                                                 | Poznámka                                                                  |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Runtime**                  | Node.js 22 LTS (Docker image `node:22-alpine` nebo `node:22-bookworm-slim`) | `sharp` a `@node-rs/argon2` používají nativní binárky (Linux x64/arm64)   |
| **Databáze**                 | PostgreSQL 16+                                                              | Musí povolit rozšíření `pg_trgm`, `unaccent`, `citext`                    |
| **Reverse proxy / TLS**      | Nginx / Caddy / Cloudflare s HTTPS                                          | Automatická obnova certifikátu (Let's Encrypt), přesměrování HTTP → HTTPS |
| **Objektové úložiště**       | S3 / Cloudflare R2 / MinIO (doporučeno) nebo persistentní volume            | Aplikace používá rozhraní `StorageProvider` v `src/lib/storage/`          |
| **SMTP / transakční e-mail** | Postmark / Resend / AWS SES / vlastní SMTP                                  | Napojení na `email_outbox` worker                                         |

---

## 2. Povinné proměnné prostředí

Nastavte v tajném úložišti (necommituje se do Gitu):

```bash
NODE_ENV=production
APP_URL=https://reaporta.cz
NEXT_PUBLIC_APP_URL=https://reaporta.cz

# Připojení k PostgreSQL (doporučeno přes PgBouncer / TLS ?sslmode=require)
DATABASE_URL=postgresql://reaporta_app:<silne-heslo>@db.internal:5432/reaporta?sslmode=require

# Minimálně 32 náhodných bajtů (openssl rand -base64 32)
BETTER_AUTH_SECRET=<vygenerovane-tajemstvi>

# Tajný klíč pro zabezpečení interního cron endpointu /api/cron/alerts
CRON_SECRET=<vygenerovane-tajemstvi>

# Sůl pro hashování IP adres v rate_limits a inquiries
IP_HASH_SALT=<vygenerovane-tajemstvi>

# Volitelně pro SMTP odesílání z email_outbox
SMTP_HOST=smtp.provider.tld
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM="ReaPorta <podpora@reaporta.cz>"
```

> Jakmile `APP_URL` začíná na `https://`, Better Auth (`src/lib/auth/auth.ts`) automaticky zapne `useSecureCookies: true` (`__Secure-` prefix + flag `Secure` + `HttpOnly` + `SameSite=Lax`) a `next.config.ts` přidá `Strict-Transport-Security`.

---

## 3. Příprava databáze a migrací

1. Vytvořte databázi a povolte požadovaná rozšíření pod rolí superuživatele:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS unaccent;
   CREATE EXTENSION IF NOT EXISTS citext;
   ```
2. Spusťte migrace před spuštěním nové verze aplikace:
   ```bash
   pnpm db:migrate
   ```
3. **Nespouštějte** `pnpm db:seed` ani `pnpm db:reset` proti produkční databázi (ochrana v `scripts/db-reset.ts` navíc blokuje názvy DB bez `dev`/`test`).
4. Naplňte číselník lokalit ČR (`locations`) z ostrých dat RÚIAN / ČÚZK a vytvořte první účet správce.

---

## 4. Úložiště fotografií (`StorageProvider`)

V MVP je aktivní `LocalStorageProvider` ukládající WebP varianty (`thumb`, `card`, `full`) do adresáře `storage/` servírovaného přes `/media/[...key]` s hlavičkou `Cache-Control: public, max-age=31536000, immutable`.

Pro nasazení s více instancemi (horizontální škálování):

1. Implementujte `S3StorageProvider` dle rozhraní `StorageProvider` (`put`, `delete`, `url`) v `src/lib/storage/`.
2. Připojte CDN před bucket a doplňte doménu CDN do `img-src` v `Content-Security-Policy` v `next.config.ts`.

---

## 5. Pravidelné úlohy (Cron)

Naplánujte spouštění dvou idempotentních úloh:

| Úloha                               | Doporučený interval                            | Příkaz / HTTP volání                                                                                              |
| ----------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Hlídací pes (nové nabídky)**      | Každých 15 min (instant) / 1× denně / 1× týdně | `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://reaporta.cz/api/cron/alerts` nebo `pnpm job:alerts` |
| **Expirace inzerátů (60 dnů)**      | 1× denně (03:00 CET)                           | `pnpm job:expire`                                                                                                 |
| **Odesílání fronty `email_outbox`** | Každou minutu (worker / cron)                  | Dopojit SMTP transport nad řádky `status = 'queued'` s exponenciálním opakováním                                  |

---

## 6. Build a spuštění aplikace

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Kontrolní bod pro load balancer / orchestrátor (healthcheck):

- `GET /api/health` — ověří dostupnost aplikace i připojení k PostgreSQL (`200 OK`).

---

## 7. Předprodukční bezpečnostní checklist

- [ ] Aktualizovat balíčky označené v `pnpm audit --prod` (`maplibre-gl`, `drizzle-orm`, `zod`, `next` / `postcss` — viz `docs/PERF.md`).
- [ ] Ověřit, že `/dev/styleguide` a `/dev/emails` vrací v produkci `404` (řízeno `NODE_ENV === "production"`).
- [ ] Ověřit přítomnost hlaviček `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] Nastavit automatické denní zálohy PostgreSQL (`pg_dump` / WAL archiving) a test obnovy.
- [ ] Připojit strukturované logování (bez osobních údajů) a alerting na 5xx chyby / selhání `email_outbox`.
