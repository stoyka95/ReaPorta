# DECISIONS.md — technická rozhodnutí a odchylky

> Zapisuj sem každou odchylku od `ARCHITECTURE.md` (jiná knihovna, jiná verze, změna schématu) a každou novou závislost. Jeden záznam = 3 řádky.

Formát:

```
## YYYY-MM-DD · Etapa N · Název rozhodnutí
Kontext: proč to vzniklo.
Rozhodnutí: co se zvolilo (a co se zamítlo).
Důsledek: co to mění.
```

---

## 2026-11-25 · Etapa 0 · Přidání `tsx`, `dotenv` a `@eslint/eslintrc` do devDependencies

Kontext: Spouštění TypeScript skriptů (`db:migrate`, `db:reset`, `db:seed`, `check:tokens`) a konfigurace ESLint 9 flat config s `eslint-config-next`.
Rozhodnutí: Přidány devDependencies `tsx`, `dotenv` a `@eslint/eslintrc`; zamítnuto spouštění skriptů přes kompilovaný JS výstup nebo `ts-node`.
Důsledek: Skripty v `scripts/*.ts` běží přímo přes `pnpm` bez dalšího build kroku a ESLint 9 korektně načítá Next.js pravidla.

## 2026-11-25 · Etapa 0 · E-maily v dev prostředí bez Mailpitu

Kontext: Zadání pro běh v sandboxu zakazuje použití Mailpitu; `docker-compose.yml` jej ponechává jen jako volitelnou službu.
Rozhodnutí: V dev prostředí běží pouze kontejner `db` (PostgreSQL 16) a odchozí e-maily se ukládají výhradně do tabulky `email_outbox`.
Důsledek: Ověřování e-mailů v testech a QA probíhá nad tabulkou `email_outbox` místo SMTP UI Mailpitu.
