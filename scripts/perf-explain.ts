import "dotenv/config";
import { Pool } from "pg";

interface QuerySpec {
  name: string;
  sql: string;
  params: unknown[];
}

async function runExplainSet(
  pool: Pool,
  label: string,
): Promise<Array<{ name: string; execMs: number; plan: string }>> {
  const client = await pool.connect();
  try {
    const sampleSlugRes = await client.query<{ slug: string }>(
      "SELECT slug FROM listings WHERE status = 'active' LIMIT 1",
    );
    const sampleSlug = sampleSlugRes.rows[0]?.slug ?? "";

    const queries: QuerySpec[] = [
      {
        name: "1. Vyhledávání: prodej bytů v Praze (cena ≤ 12 M, řazeno od nejnovějších)",
        sql: `
          SELECT l.id, l.slug, l.title, l.price, l.usable_area, l.published_at
          FROM listings l
          INNER JOIN locations loc ON loc.id = l.location_id
          WHERE l.status = 'active'
            AND l.offer_type = 'sale'
            AND l.category = 'flat'
            AND (loc.full_slug = 'hlavni-mesto-praha' OR loc.full_slug LIKE 'hlavni-mesto-praha/%')
            AND l.price <= 12000000
          ORDER BY l.published_at DESC NULLS LAST
          LIMIT 24 OFFSET 0
        `,
        params: [],
      },
      {
        name: "2. Fulltext + vybavení (GIN search_text + GIN amenities)",
        sql: `
          SELECT l.id, l.slug, l.title, l.price
          FROM listings l
          WHERE l.status = 'active'
            AND l.search_text @@ websearch_to_tsquery('simple', immutable_unaccent($1))
            AND l.amenities @> ARRAY['balcony']::text[]
          ORDER BY l.published_at DESC NULLS LAST
          LIMIT 24
        `,
        params: ["Praha byt"],
      },
      {
        name: "3. Mapa bbox (Praha a okolí, max 2000 bodů)",
        sql: `
          SELECT l.id, l.lat, l.lng, l.price, l.category, l.offer_type
          FROM listings l
          WHERE l.status = 'active'
            AND l.offer_type = 'sale'
            AND l.lat BETWEEN 49.94 AND 50.18
            AND l.lng BETWEEN 14.22 AND 14.71
          LIMIT 2000
        `,
        params: [],
      },
      {
        name: "4. Našeptávač lokalit (GIN trigram unaccent)",
        sql: `
          SELECT id, name, type, full_slug, population,
                 similarity(immutable_unaccent(lower(name)), immutable_unaccent(lower($1))) AS sim
          FROM locations
          WHERE immutable_unaccent(lower(name)) LIKE immutable_unaccent(lower($1)) || '%'
             OR immutable_unaccent(lower(name)) % immutable_unaccent(lower($1))
          ORDER BY (immutable_unaccent(lower(name)) LIKE immutable_unaccent(lower($1)) || '%') DESC,
                   sim DESC,
                   population DESC
          LIMIT 8
        `,
        params: ["brno"],
      },
      {
        name: "5. Detail nabídky podle slugu (UNIQUE index)",
        sql: `
          SELECT l.*, ap.display_name, a.name AS agency_name
          FROM listings l
          LEFT JOIN agent_profiles ap ON ap.user_id = l.agent_id
          LEFT JOIN agencies a ON a.id = l.agency_id
          WHERE l.slug = $1
          LIMIT 1
        `,
        params: [sampleSlug],
      },
    ];

    console.log(`\n=== ${label} ===`);
    const results: Array<{ name: string; execMs: number; plan: string }> = [];

    for (const q of queries) {
      const res = await client.query<{ "QUERY PLAN": string }>(
        `EXPLAIN (ANALYZE, BUFFERS) ${q.sql}`,
        q.params,
      );
      const lines = res.rows.map((r) => r["QUERY PLAN"]);
      const plan = lines.join("\n");
      const execMatch = plan.match(/Execution Time:\s+([0-9.]+)\s+ms/);
      const execMs = execMatch ? Number.parseFloat(execMatch[1]!) : -1;
      console.log(`\n${q.name} => ${execMs.toFixed(2)} ms`);
      console.log(plan);
      results.push({ name: q.name, execMs, plan });
    }
    return results;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const devUrl =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_dev";
  const testUrl =
    process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/reaporta_test";

  const devPool = new Pool({ connectionString: devUrl });
  try {
    await runExplainSet(devPool, "reaporta_dev (400 inzerátů)");
  } finally {
    await devPool.end();
  }

  // Benchmark nad 10 000 řádky v reaporta_test (dočasné řádky se po měření smažou)
  const testPool = new Pool({ connectionString: testUrl });
  const client = await testPool.connect();
  try {
    const existingRes = await client.query<{ cnt: number }>(
      "SELECT count(*)::int AS cnt FROM listings",
    );
    const existingCount = existingRes.rows[0]?.cnt ?? 0;
    const toInsert = Math.max(0, 10_000 - existingCount);

    if (toInsert > 0) {
      console.log(`\nVkládám ${toInsert} dočasných benchmarkových inzerátů do reaporta_test...`);
      await client.query(
        `
        WITH base AS (
          SELECT id, agent_id, agency_id, offer_type, category, disposition, title, description,
                 price, price_unit, location_id, city, district, lat, lng, usable_area,
                 amenities, published_at, expires_at
          FROM listings
          WHERE status = 'active'
          LIMIT 250
        ),
        expanded AS (
          SELECT b.*, gs AS seq
          FROM base b
          CROSS JOIN generate_series(1, CEIL($1::numeric / GREATEST((SELECT count(*) FROM base), 1))::int) AS gs
          LIMIT $1
        )
        INSERT INTO listings (
          slug, agent_id, agency_id, status, offer_type, category, disposition, title, description,
          price, price_unit, location_id, city, district, lat, lng, usable_area,
          amenities, published_at, expires_at
        )
        SELECT
          'bench-10k-' || seq || '-' || substr(md5(id::text || seq::text), 1, 8),
          agent_id,
          agency_id,
          'active'::listing_status,
          offer_type,
          category,
          disposition,
          title,
          description,
          GREATEST(500000, COALESCE(price, 5000000) + ((seq % 20) - 10) * 100000),
          price_unit,
          location_id,
          city,
          district,
          lat + (((seq % 100) - 50) * 0.0005),
          lng + (((seq % 100) - 50) * 0.0005),
          usable_area,
          amenities,
          COALESCE(published_at, now()) - (seq || ' minutes')::interval,
          COALESCE(expires_at, now() + interval '60 days')
        FROM expanded
        `,
        [toInsert],
      );
      await client.query("ANALYZE listings; ANALYZE locations;");
    }

    const totalRes = await client.query<{ cnt: number }>(
      "SELECT count(*)::int AS cnt FROM listings",
    );
    console.log(`Celkem v reaporta_test pro benchmark: ${totalRes.rows[0]?.cnt} inzerátů`);

    const benchResults = await runExplainSet(testPool, "reaporta_test (10 000 inzerátů)");
    const maxExec = Math.max(...benchResults.map((r) => r.execMs));
    console.log(
      `\nMAX Execution Time nad 10 000 inzeráty: ${maxExec.toFixed(2)} ms (cíl ≤ 300 ms)`,
    );
  } finally {
    await client.query("DELETE FROM listings WHERE slug LIKE 'bench-10k-%'");
    await client.query("ANALYZE listings;");
    client.release();
    await testPool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
