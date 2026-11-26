import "dotenv/config";
import crypto from "node:crypto";
import { fakerCS_CZ as faker } from "@faker-js/faker";
import { eq, sql } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { assertSafeDevOrTestDatabase } from "../src/db/client";
import { slugify, generateListingSlug } from "../src/lib/slug";
import { CZECH_LOCATIONS } from "./data/czech-locations";
import {
  STREET_NAMES,
  INTRO_TEMPLATES,
  NEIGHBORHOOD_TEMPLATES,
  DETAIL_SENTENCES,
  CLOSING_SENTENCES,
} from "./data/listing-templates";
import { generatePlaceholderPhotos, type PoolPhotoMeta } from "./generate-placeholder-photos";
import { hashPassword } from "../src/lib/auth/password";

type OfferType = "sale" | "rent";
type Category = "flat" | "house" | "land" | "commercial" | "other";
type Disposition =
  | "1+kk"
  | "1+1"
  | "2+kk"
  | "2+1"
  | "3+kk"
  | "3+1"
  | "4+kk"
  | "4+1"
  | "5+kk"
  | "5+1"
  | "6_and_more"
  | "atypical";
type BuildingType = "brick" | "panel" | "wood" | "stone" | "skeleton" | "mixed" | "other";
type Condition =
  | "new_build"
  | "very_good"
  | "good"
  | "after_renovation"
  | "before_renovation"
  | "under_construction"
  | "project"
  | "demolition";
type Ownership = "personal" | "cooperative" | "state" | "other";
type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type Furnished = "yes" | "partly" | "no";
type ListingStatus = "draft" | "pending" | "active" | "paused" | "sold" | "rejected" | "expired";

interface SeededLocationNode {
  id: number;
  name: string;
  city: string;
  district: string | null;
  fullSlug: string;
  lat: number;
  lng: number;
  weight: number;
  tier: "praha" | "brno" | "other";
  isUrban: boolean;
}

function pickWeighted<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((acc, x) => acc + x.weight, 0);
  let r = faker.number.float({ min: 0, max: total });
  for (const entry of items) {
    r -= entry.weight;
    if (r <= 0) return entry.item;
  }
  return items[items.length - 1]!.item;
}

function pickEnergyClass(): EnergyClass | null {
  const roll = faker.number.float({ min: 0, max: 100 });
  if (roll < 5) return null;
  if (roll < 23) return faker.helpers.arrayElement<EnergyClass>(["A", "B"]);
  if (roll < 73) return faker.helpers.arrayElement<EnergyClass>(["C", "D"]);
  return faker.helpers.arrayElement<EnergyClass>(["E", "F", "G"]);
}

function formatCategoryGenitive(cat: Category): string {
  switch (cat) {
    case "flat":
      return "bytu";
    case "house":
      return "rodinného domu";
    case "land":
      return "pozemku";
    case "commercial":
      return "komerčního prostoru";
    case "other":
      return "garáže";
  }
}

function formatDispositionLabel(d: Disposition | null): string {
  if (!d) return "";
  if (d === "6_and_more") return "6 a více";
  if (d === "atypical") return "atypický";
  return d;
}

function buildDescription(
  category: Category,
  offerType: OfferType,
  disposition: Disposition | null,
  area: number,
  locationLabel: string,
  amenities: string[],
  isLong = false,
): string {
  const offerDat = offerType === "sale" ? "prodeji" : "pronájmu";
  const disp = formatDispositionLabel(disposition) || "prostorné dispozice";
  const introRaw = faker.helpers.arrayElement(INTRO_TEMPLATES[category]);
  const intro = introRaw
    .replaceAll("{offerDat}", offerDat)
    .replaceAll("{disp}", disp)
    .replaceAll("{area}", String(Math.round(area)))
    .replaceAll("{loc}", locationLabel);

  const detail = faker.helpers.arrayElement(DETAIL_SENTENCES);
  const neighborhood = faker.helpers.arrayElement(NEIGHBORHOOD_TEMPLATES[category]);
  const amenityLabels: Record<string, string> = {
    balcony: "balkon",
    terrace: "terasa",
    loggia: "lodžie",
    cellar: "sklep",
    elevator: "výtah",
    garage: "garáž",
    parking: "parkovací stání",
    garden: "zahrada",
    pool: "bazén",
    barrier_free: "bezbariérový přístup",
    ac: "klimatizace",
    fireplace: "krb",
  };
  const amenityText =
    amenities.length > 0
      ? `Součástí vybavení je ${amenities.map((a) => amenityLabels[a] ?? a).join(", ")}.`
      : "Prostor je připraven k individuálnímu dovybavení dle potřeb nového uživatele.";
  const closing = faker.helpers.arrayElement(CLOSING_SENTENCES);

  const paragraphs = [`${intro} ${detail}`, `${neighborhood} ${amenityText}`, closing];

  if (isLong) {
    paragraphs.splice(
      2,
      0,
      "Technický standard zahrnuje kvalitní izolační okna s trojsklem, rekuperaci vzduchu, přípravu na venkovní žaluzie a optickou přípojku vysokorychlostního internetu. Společné prostory domu prošly citlivou revitalizací včetně nového osvětlení, kolárny a kočárkárny. Při návrhu dispozice byl kladen důraz na akustickou pohodu mezi jednotlivými místnostmi a dostatek přirozeného denního světla po celý den.",
      "V rámci prohlídky rádi předložíme kompletní projektovou dokumentaci, průkaz energetické náročnosti budovy, evidenční list i přehled měsíčních záloh na energie a služby. Financování hypotečním úvěrem je možné bez omezení a termín předání lze přizpůsobit potřebám kupujícího.",
    );
  }

  return paragraphs.join("\n\n");
}

function selectPhotosForListing(
  pool: PoolPhotoMeta[],
  category: Category,
  count: number,
  titleContext: string,
): Array<{ meta: PoolPhotoMeta; alt: string; isCover: boolean }> {
  if (count <= 0) return [];
  const byCat = (c: PoolPhotoMeta["category"]) => pool.filter((p) => p.category === c);

  let coverPool: PoolPhotoMeta[];
  let interiorPool: PoolPhotoMeta[];

  if (category === "flat") {
    coverPool = [...byCat("living"), ...byCat("exterior")];
    interiorPool = [
      ...byCat("living"),
      ...byCat("kitchen"),
      ...byCat("bedroom"),
      ...byCat("bathroom"),
      ...byCat("exterior"),
    ];
  } else if (category === "house") {
    coverPool = byCat("house");
    interiorPool = [
      ...byCat("house"),
      ...byCat("living"),
      ...byCat("kitchen"),
      ...byCat("bedroom"),
      ...byCat("bathroom"),
    ];
  } else if (category === "land") {
    coverPool = byCat("land");
    interiorPool = [...byCat("land"), ...byCat("house")];
  } else if (category === "commercial") {
    coverPool = byCat("commercial");
    interiorPool = [...byCat("commercial"), ...byCat("exterior"), ...byCat("living")];
  } else {
    coverPool = byCat("other");
    interiorPool = [...byCat("other"), ...byCat("exterior")];
  }

  const chosen: PoolPhotoMeta[] = [];
  const first = faker.helpers.arrayElement(coverPool);
  chosen.push(first);

  for (let i = 1; i < count; i++) {
    const candidate =
      interiorPool[
        (i + faker.number.int({ min: 0, max: interiorPool.length - 1 })) % interiorPool.length
      ]!;
    chosen.push(candidate);
  }

  return chosen.map((meta, idx) => ({
    meta,
    isCover: idx === 0,
    alt: `${meta.roomLabelCs} – ${titleContext}, foto ${idx + 1} z ${count}`,
  }));
}

export async function runSeed(databaseUrl = process.env.DATABASE_URL): Promise<void> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL není nastavena.");
  }

  const dbName = assertSafeDevOrTestDatabase(databaseUrl);
  const started = Date.now();
  console.log(`Seeduji databázi "${dbName}" (faker.seed(2026))...`);
  faker.seed(2026);

  const photoPool = await generatePlaceholderPhotos(false);

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    // 1. Seed Locations
    const listingTargets: SeededLocationNode[] = [];
    const allObceIds: number[] = [];
    let krajCount = 0;
    let okresCount = 0;
    let obecCount = 0;
    let castCount = 0;

    for (const kraj of CZECH_LOCATIONS) {
      const krajSlug = slugify(kraj.name);
      const [krajRow] = await db
        .insert(schema.locations)
        .values({
          parentId: null,
          type: "kraj",
          name: kraj.name,
          slug: krajSlug,
          fullSlug: krajSlug,
          lat: kraj.lat,
          lng: kraj.lng,
          population: kraj.population,
        })
        .returning();
      krajCount++;

      for (const okres of kraj.okresy) {
        const okresSlug = slugify(okres.name);
        const okresFullSlug = `${krajSlug}/${okresSlug}`;
        const [okresRow] = await db
          .insert(schema.locations)
          .values({
            parentId: krajRow!.id,
            type: "okres",
            name: okres.name,
            slug: okresSlug,
            fullSlug: okresFullSlug,
            lat: okres.lat,
            lng: okres.lng,
            population: okres.population,
          })
          .returning();
        okresCount++;

        for (const obec of okres.obce ?? []) {
          const obecSlug = slugify(obec.name);
          const obecFullSlug = `${okresFullSlug}/${obecSlug}`;
          const [obecRow] = await db
            .insert(schema.locations)
            .values({
              parentId: okresRow!.id,
              type: "obec",
              name: obec.name,
              slug: obecSlug,
              fullSlug: obecFullSlug,
              lat: obec.lat,
              lng: obec.lng,
              population: obec.population,
            })
            .returning();
          obecCount++;
          allObceIds.push(obecRow!.id);

          const tier: "praha" | "brno" | "other" =
            obec.name === "Praha" ? "praha" : obec.name === "Brno" ? "brno" : "other";
          const obecWeight = obec.weight ?? 0.35;

          if (obec.casts && obec.casts.length > 0) {
            const perCastWeight = obecWeight / obec.casts.length;
            for (const cast of obec.casts) {
              const castSlug = slugify(cast.name);
              const castFullSlug = `${obecFullSlug}/${castSlug}`;
              const [castRow] = await db
                .insert(schema.locations)
                .values({
                  parentId: obecRow!.id,
                  type: "cast",
                  name: cast.name,
                  slug: castSlug,
                  fullSlug: castFullSlug,
                  lat: cast.lat,
                  lng: cast.lng,
                  population: cast.population,
                })
                .returning();
              castCount++;

              if (obecWeight > 0) {
                listingTargets.push({
                  id: castRow!.id,
                  name: cast.name,
                  city: obec.name,
                  district: cast.name,
                  fullSlug: castFullSlug,
                  lat: cast.lat,
                  lng: cast.lng,
                  weight: perCastWeight,
                  tier,
                  isUrban: true,
                });
              }
            }
          } else if (obecWeight > 0) {
            listingTargets.push({
              id: obecRow!.id,
              name: obec.name,
              city: obec.name,
              district: null,
              fullSlug: obecFullSlug,
              lat: obec.lat,
              lng: obec.lng,
              weight: obecWeight,
              tier,
              isUrban: obec.population >= 25000,
            });
          }
        }
      }
    }

    // 2. Seed Users (1 admin, 14 agents, 8 regular users)
    const passwordHash = await hashPassword("Heslo12345!");

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        email: "admin@reaporta.test",
        emailVerified: true,
        emailVerifiedAt: new Date("2026-01-10T09:00:00Z"),
        name: "Správce ReaPorta",
        phone: "+420 222 100 001",
        role: "admin",
      })
      .returning();

    await db.insert(schema.accounts).values({
      userId: adminUser!.id,
      accountId: adminUser!.id,
      providerId: "credential",
      password: passwordHash,
    });

    // 3. Seed Agencies (4, 1 without logo)
    const agencyDefs = [
      {
        name: "Bohemia Home Reality",
        slug: "bohemia-home-reality",
        logoKey: "agencies/bohemia-home.webp",
        description:
          "Specializujeme se na rezidenční nemovitosti v Praze a Středočeském kraji s důrazem na osobní přístup a transparentní jednání.",
        website: "https://bohemia-home.reaporta.test",
        email: "info@bohemia-home.test",
        phone: "+420 222 310 100",
        address: "Vinohradská 48, 120 00 Praha 2",
      },
      {
        name: "Moravia Reality Partners",
        slug: "moravia-reality-partners",
        logoKey: "agencies/moravia-reality.webp",
        description:
          "Brněnská a moravská kancelář zaměřená na byty, rodinné domy i investiční projekty po celé Moravě.",
        website: "https://moravia-partners.reaporta.test",
        email: "kontakt@moravia-partners.test",
        phone: "+420 541 210 200",
        address: "Veveří 31, 602 00 Brno",
      },
      {
        name: "Atelier Bydlení",
        slug: "atelier-bydleni",
        logoKey: "agencies/atelier-bydleni.webp",
        description:
          "Architektonicky orientovaná realitní kancelář propojující moderní bydlení, novostavby a rekonstruované byty.",
        website: "https://atelier-bydleni.reaporta.test",
        email: "hello@atelier-bydleni.test",
        phone: "+420 377 410 300",
        address: "Sady Pětatřicátníků 14, 301 00 Plzeň",
      },
      {
        name: "Krajina & Domov",
        slug: "krajina-a-domov",
        logoKey: null, // Záměrně bez loga dle SEED-DATA.md
        description: "Rodinné domy, chalupy a stavební pozemky v regionech České republiky.",
        website: "https://krajina-domov.reaporta.test",
        email: "kancelar@krajina-domov.test",
        phone: "+420 485 110 400",
        address: "Pražská 22, 460 01 Liberec",
      },
    ];

    const agencyRows = await db.insert(schema.agencies).values(agencyDefs).returning();

    // 4. Seed 14 Agents (1 makler@reaporta.test, 2 private without agency, 1 without photo)
    const agentNames = [
      "Tereza Novotná",
      "Jakub Dvořák",
      "Klára Svobodová",
      "Martin Procházka",
      "Barbora Kučerová",
      "Ondřej Veselý",
      "Lucie Horáková",
      "Petr Němec",
      "Veronika Pokorná",
      "Tomáš Marek",
      "Eva Králová",
      "Filip Beneš",
      "Michaela Fialová",
      "Jan Sedláček",
    ];

    const agentUsers: Array<{ userId: string; agencyId: string | null; name: string }> = [];

    for (let i = 0; i < agentNames.length; i++) {
      const displayName = agentNames[i]!;
      const email = i === 0 ? "makler@reaporta.test" : `${slugify(displayName)}@reaporta.test`;
      const phone = `+420 60${(i % 8) + 1} ${String(120 + i * 17).padStart(3, "0")} ${String(310 + i * 29).padStart(3, "0")}`;
      const [u] = await db
        .insert(schema.users)
        .values({
          email,
          emailVerified: true,
          emailVerifiedAt: new Date("2026-01-15T10:00:00Z"),
          name: displayName,
          phone,
          role: "agent",
        })
        .returning();

      await db.insert(schema.accounts).values({
        userId: u!.id,
        accountId: u!.id,
        providerId: "credential",
        password: passwordHash,
      });

      // Poslední 2 makléři jsou soukromí inzerenti bez agentury
      const agencyId = i >= 12 ? null : agencyRows[i % agencyRows.length]!.id;
      // Makléř na indexu 13 záměrně bez fotky (iniciály)
      const photoKey = i === 13 ? null : null; // Fotky avatarů jsou volitelné, komponenta Avatar zobrazí iniciály

      await db.insert(schema.agentProfiles).values({
        userId: u!.id,
        agencyId,
        displayName,
        slug: slugify(displayName),
        bio: `${displayName} působí v oboru nemovitostí více než ${4 + (i % 11)} let. Zaměřuje se na jasnou komunikaci, férové ocenění a bezpečný průběh celého převodu.`,
        photoKey,
        phonePublic: phone,
        emailPublic: email,
        languages: i % 3 === 0 ? ["cs", "en"] : i % 5 === 0 ? ["cs", "en", "de"] : ["cs"],
        verifiedAt: i < 12 ? new Date("2026-02-01T08:00:00Z") : null,
      });

      agentUsers.push({ userId: u!.id, agencyId, name: displayName });
    }

    // 5. Seed 8 Regular Users (uzivatel@reaporta.test + 7 dalších)
    const regularUserNames = [
      "Anna Kratochvílová",
      "David Černý",
      "Karolína Malá",
      "Lukáš Jelínek",
      "Eliška Říhová",
      "Marek Růžička",
      "Simona Konečná",
      "Matěj Vlček",
    ];
    const regularUsers: Array<{ id: string; email: string; name: string }> = [];

    for (let i = 0; i < regularUserNames.length; i++) {
      const name = regularUserNames[i]!;
      const email = i === 0 ? "uzivatel@reaporta.test" : `uzivatel${i + 1}@reaporta.test`;
      const [u] = await db
        .insert(schema.users)
        .values({
          email,
          emailVerified: true,
          emailVerifiedAt: new Date("2026-02-10T11:00:00Z"),
          name,
          phone: `+420 77${(i % 7) + 1} ${String(200 + i * 31).padStart(3, "0")} ${String(400 + i * 19).padStart(3, "0")}`,
          role: "user",
        })
        .returning();

      await db.insert(schema.accounts).values({
        userId: u!.id,
        accountId: u!.id,
        providerId: "credential",
        password: passwordHash,
      });

      regularUsers.push({ id: u!.id, email, name });
    }

    // 6. Seed 400 Listings (360 active, 20 pending, 8 draft, 6 sold, 4 expired, 2 rejected)
    const statusPlan: ListingStatus[] = [
      ...Array<ListingStatus>(360).fill("active"),
      ...Array<ListingStatus>(20).fill("pending"),
      ...Array<ListingStatus>(8).fill("draft"),
      ...Array<ListingStatus>(6).fill("sold"),
      ...Array<ListingStatus>(4).fill("expired"),
      ...Array<ListingStatus>(2).fill("rejected"),
    ];

    const weightedLocations = listingTargets.map((loc) => ({ item: loc, weight: loc.weight }));
    const prahaLocations = listingTargets.filter((l) => l.tier === "praha");
    const brnoLocations = listingTargets.filter((l) => l.tier === "brno");
    const plzenLocations = listingTargets.filter((l) => l.city === "Plzeň");

    const activeListingIds: string[] = [];
    const activeListingAgentPairs: Array<{ id: string; agentId: string }> = [];
    const allImageRows: Array<typeof schema.listingImages.$inferInsert> = [];
    const allPriceHistoryRows: Array<typeof schema.listingPriceHistory.$inferInsert> = [];

    const now = new Date("2026-11-25T12:00:00Z");

    for (let i = 0; i < statusPlan.length; i++) {
      const status = statusPlan[i]!;
      const agent = agentUsers[i % agentUsers.length]!;

      // Edge-case markers on specific active listings so every edge case is guaranteed
      const isOnePhoto = i === 0;
      const isFortyPhotos = i === 1;
      const isZeroPhotos = i === 2;
      const isPriceOnRequest = i === 3;
      const isPriceNegotiable = i === 4;
      const isLongTitle = i === 5;
      const isLongDesc = i === 6;
      const isRentWithFees = i === 7;
      const isFlatNoPenb = i === 8;
      const isLandNoDisp = i === 9;
      const isReducedPrice = i >= 10 && i <= 35;

      let offerType: OfferType = faker.number.float({ min: 0, max: 1 }) < 0.55 ? "sale" : "rent";
      let category: Category = pickWeighted<Category>([
        { item: "flat", weight: 55 },
        { item: "house", weight: 25 },
        { item: "land", weight: 8 },
        { item: "commercial", weight: 8 },
        { item: "other", weight: 4 },
      ]);

      if (isRentWithFees) {
        offerType = "rent";
        category = "flat";
      } else if (isFlatNoPenb) {
        offerType = "sale";
        category = "flat";
      } else if (isLandNoDisp) {
        offerType = "sale";
        category = "land";
      } else if (isOnePhoto || isFortyPhotos || isZeroPhotos || isReducedPrice) {
        offerType = "sale";
        category = i % 3 === 0 ? "house" : "flat";
      }

      const loc =
        i < 15
          ? prahaLocations[i % prahaLocations.length]!
          : i < 22
            ? brnoLocations[i % brnoLocations.length]!
            : i < 26
              ? plzenLocations[i % plzenLocations.length]!
              : pickWeighted(weightedLocations);

      // Jitter coordinates within ~3 km (urban) or ~10 km (rural)
      const jitterDeg = loc.isUrban ? 0.018 : 0.055;
      const lat = Number(
        (loc.lat + faker.number.float({ min: -jitterDeg, max: jitterDeg })).toFixed(6),
      );
      const lng = Number(
        (loc.lng + faker.number.float({ min: -jitterDeg * 1.4, max: jitterDeg * 1.4 })).toFixed(6),
      );
      const showExactLocation =
        i === 0 ? true : i === 1 ? false : faker.number.float({ min: 0, max: 1 }) >= 0.35;

      // Disposition & areas
      let disposition: Disposition | null = null;
      let usableArea: number | null = null;
      let landArea: number | null = null;
      let builtArea: number | null = null;
      let subtype: string | null = null;

      if (category === "flat") {
        disposition = pickWeighted<Disposition>([
          { item: "1+kk", weight: 14 },
          { item: "1+1", weight: 6 },
          { item: "2+kk", weight: 28 },
          { item: "2+1", weight: 12 },
          { item: "3+kk", weight: 20 },
          { item: "3+1", weight: 8 },
          { item: "4+kk", weight: 7 },
          { item: "4+1", weight: 2 },
          { item: "5+kk", weight: 2 },
          { item: "atypical", weight: 1 },
        ]);
        const areaRanges: Record<Disposition, [number, number]> = {
          "1+kk": [22, 38],
          "1+1": [30, 44],
          "2+kk": [40, 62],
          "2+1": [48, 68],
          "3+kk": [65, 95],
          "3+1": [70, 98],
          "4+kk": [90, 130],
          "4+1": [95, 135],
          "5+kk": [125, 175],
          "5+1": [130, 180],
          "6_and_more": [160, 240],
          atypical: [55, 140],
        };
        const [minA, maxA] = areaRanges[disposition];
        usableArea = faker.number.int({ min: minA, max: maxA });
      } else if (category === "house") {
        subtype = faker.helpers.arrayElement(["rodinný", "vila", "chalupa", "řadový", "dvojdomek"]);
        disposition = faker.helpers.arrayElement<Disposition>([
          "4+kk",
          "4+1",
          "5+kk",
          "5+1",
          "6_and_more",
        ]);
        usableArea = faker.number.int({ min: 90, max: 320 });
        landArea = faker.number.int({ min: 280, max: 1800 });
        builtArea = Math.round(usableArea * 0.65);
      } else if (category === "land") {
        subtype = faker.helpers.arrayElement(["stavební", "zahrada", "komerční"]);
        landArea = faker.number.int({ min: 400, max: 5000 });
        usableArea = landArea;
      } else if (category === "commercial") {
        subtype = faker.helpers.arrayElement([
          "kancelář",
          "obchod",
          "sklad",
          "restaurace",
          "ordinace",
        ]);
        usableArea = faker.number.int({ min: 35, max: 450 });
      } else {
        subtype = faker.helpers.arrayElement(["garáž", "parkovací stání", "sklep"]);
        usableArea = faker.number.int({ min: 14, max: 32 });
      }

      // Realistic pricing per SEED-DATA.md
      let price: number | null = null;
      const priceUnit: "total" | "per_month" | "per_m2_month" =
        offerType === "sale" ? "total" : "per_month";

      if (category === "flat") {
        if (offerType === "sale") {
          const perM2 =
            loc.tier === "praha"
              ? faker.number.int({ min: 110_000, max: 190_000 })
              : loc.tier === "brno"
                ? faker.number.int({ min: 90_000, max: 140_000 })
                : faker.number.int({ min: 40_000, max: 85_000 });
          price = Math.round((perM2 * (usableArea ?? 60)) / 10_000) * 10_000;
        } else {
          const perM2 =
            loc.tier === "praha"
              ? faker.number.int({ min: 330, max: 560 })
              : loc.tier === "brno"
                ? faker.number.int({ min: 280, max: 420 })
                : faker.number.int({ min: 150, max: 300 });
          price = Math.round((perM2 * (usableArea ?? 55)) / 500) * 500;
        }
      } else if (category === "house") {
        if (offerType === "sale") {
          const range: [number, number] =
            loc.tier === "praha"
              ? [9_000_000, 35_000_000]
              : loc.tier === "brno"
                ? [7_000_000, 25_000_000]
                : [3_000_000, 12_000_000];
          price = Math.round(faker.number.int({ min: range[0], max: range[1] }) / 50_000) * 50_000;
        } else {
          const range: [number, number] =
            loc.tier === "praha"
              ? [45_000, 95_000]
              : loc.tier === "brno"
                ? [35_000, 65_000]
                : [22_000, 45_000];
          price = Math.round(faker.number.int({ min: range[0], max: range[1] }) / 1000) * 1000;
        }
      } else if (category === "land") {
        const perM2 =
          loc.tier === "praha"
            ? faker.number.int({ min: 4_000, max: 25_000 })
            : loc.tier === "brno"
              ? faker.number.int({ min: 3_000, max: 12_000 })
              : faker.number.int({ min: 300, max: 4_000 });
        price =
          offerType === "sale"
            ? Math.round((perM2 * (landArea ?? 800)) / 10_000) * 10_000
            : Math.round(faker.number.int({ min: 5_000, max: 25_000 }) / 500) * 500;
      } else if (category === "commercial") {
        price =
          offerType === "sale"
            ? Math.round(faker.number.int({ min: 3_500_000, max: 28_000_000 }) / 50_000) * 50_000
            : Math.round(faker.number.int({ min: 18_000, max: 110_000 }) / 1000) * 1000;
      } else {
        price =
          offerType === "sale"
            ? Math.round(faker.number.int({ min: 450_000, max: 1_450_000 }) / 10_000) * 10_000
            : Math.round(faker.number.int({ min: 1_800, max: 4_500 }) / 100) * 100;
      }

      const priceOnRequest = isPriceOnRequest;
      if (priceOnRequest) {
        price = null;
      }
      const priceNegotiable =
        isPriceNegotiable || (!priceOnRequest && faker.number.float({ min: 0, max: 1 }) < 0.14);

      const feesMonthly =
        offerType === "rent"
          ? isRentWithFees
            ? 4500
            : Math.round(faker.number.int({ min: 2200, max: 6800 }) / 100) * 100
          : null;
      const deposit =
        offerType === "rent" && price !== null
          ? isRentWithFees
            ? price * 2
            : price * faker.helpers.arrayElement([1, 2])
          : null;

      // Building details
      const buildingType: BuildingType | null =
        category === "land"
          ? null
          : pickWeighted<BuildingType>([
              { item: "brick", weight: 52 },
              { item: "panel", weight: category === "flat" ? 24 : 2 },
              { item: "wood", weight: category === "house" ? 12 : 1 },
              { item: "skeleton", weight: 10 },
              { item: "mixed", weight: 10 },
              { item: "stone", weight: 4 },
            ]);

      const yearBuilt =
        category === "land"
          ? null
          : buildingType === "panel"
            ? faker.number.int({ min: 1960, max: 1992 })
            : faker.number.int({ min: 1890, max: 2026 });

      const condition: Condition | null =
        category === "land"
          ? null
          : yearBuilt && yearBuilt >= 2023
            ? "new_build"
            : faker.helpers.arrayElement<Condition>([
                "very_good",
                "good",
                "after_renovation",
                "before_renovation",
              ]);

      const ownership: Ownership | null =
        category === "flat"
          ? faker.helpers.arrayElement<Ownership>([
              "personal",
              "personal",
              "personal",
              "cooperative",
            ])
          : "personal";

      const floorsTotal =
        category === "flat"
          ? faker.number.int({ min: 2, max: 12 })
          : category === "house"
            ? faker.number.int({ min: 1, max: 3 })
            : category === "commercial"
              ? faker.number.int({ min: 1, max: 8 })
              : null;

      const floor =
        category === "flat" && floorsTotal !== null
          ? faker.number.int({ min: 0, max: floorsTotal })
          : category === "commercial" && floorsTotal !== null
            ? faker.number.int({ min: 0, max: Math.min(3, floorsTotal) })
            : null;

      const energyClass = isFlatNoPenb || category === "land" ? null : pickEnergyClass();
      const furnished: Furnished | null =
        category === "flat" || category === "house"
          ? faker.helpers.arrayElement<Furnished>(["yes", "partly", "no"])
          : null;

      // Consistent amenities (elevator only if floorsTotal >= 4)
      const amenities: string[] = [];
      if (category === "flat") {
        if (faker.number.float({ min: 0, max: 1 }) < 0.45) amenities.push("balcony");
        else if (faker.number.float({ min: 0, max: 1 }) < 0.25) amenities.push("loggia");
        else if (faker.number.float({ min: 0, max: 1 }) < 0.15) amenities.push("terrace");
        if (faker.number.float({ min: 0, max: 1 }) < 0.6) amenities.push("cellar");
        if (
          floorsTotal !== null &&
          floorsTotal >= 4 &&
          faker.number.float({ min: 0, max: 1 }) < 0.8
        ) {
          amenities.push("elevator");
        }
        if (faker.number.float({ min: 0, max: 1 }) < 0.35) amenities.push("parking");
        if (faker.number.float({ min: 0, max: 1 }) < 0.15) amenities.push("garage");
        if (faker.number.float({ min: 0, max: 1 }) < 0.18) amenities.push("barrier_free");
        if (faker.number.float({ min: 0, max: 1 }) < 0.16) amenities.push("ac");
      } else if (category === "house") {
        amenities.push("garden");
        if (faker.number.float({ min: 0, max: 1 }) < 0.65) amenities.push("terrace");
        if (faker.number.float({ min: 0, max: 1 }) < 0.55) amenities.push("garage");
        if (faker.number.float({ min: 0, max: 1 }) < 0.7) amenities.push("parking");
        if (faker.number.float({ min: 0, max: 1 }) < 0.35) amenities.push("cellar");
        if (faker.number.float({ min: 0, max: 1 }) < 0.25) amenities.push("fireplace");
        if (faker.number.float({ min: 0, max: 1 }) < 0.12) amenities.push("pool");
      } else if (category === "commercial") {
        if (faker.number.float({ min: 0, max: 1 }) < 0.6) amenities.push("parking");
        if (faker.number.float({ min: 0, max: 1 }) < 0.45) amenities.push("ac");
        if (faker.number.float({ min: 0, max: 1 }) < 0.4) amenities.push("barrier_free");
      }

      const offerTitlePrefix = offerType === "sale" ? "Prodej" : "Pronájem";
      const locDisplay = loc.district ?? loc.city;
      const dispLabel = formatDispositionLabel(disposition);
      const areaDisplay = Math.round(usableArea ?? landArea ?? 50);

      let title =
        category === "flat" && dispLabel
          ? `${offerTitlePrefix} ${formatCategoryGenitive(category)} ${dispLabel}, ${areaDisplay} m², ${locDisplay}`
          : `${offerTitlePrefix} ${formatCategoryGenitive(category)}, ${areaDisplay} m², ${locDisplay}`;

      if (isLongTitle) {
        title = `${offerTitlePrefix} výjimečně světlého mezonetového bytu ${dispLabel || "4+kk"} s velkou jižní terasou, dvěma garážovými stáními a panoramatickým výhledem, ${areaDisplay} m², ${locDisplay}`;
      }

      const suffix = (100000 + i * 7919).toString(36).slice(0, 6).padEnd(6, "x");
      const slug = generateListingSlug({
        category,
        disposition,
        locationName: locDisplay,
        area: areaDisplay,
        suffix,
      });

      const daysAgo = faker.number.int({ min: 0, max: 45 });
      const createdAt = new Date(now.getTime() - (daysAgo + 2) * 86_400_000);
      const publishedAt =
        status === "draft" || status === "pending"
          ? null
          : new Date(now.getTime() - daysAgo * 86_400_000);
      const expiresAt =
        status === "expired"
          ? new Date(now.getTime() - 3 * 86_400_000)
          : publishedAt
            ? new Date(publishedAt.getTime() + 60 * 86_400_000)
            : null;

      const street = faker.helpers.arrayElement(STREET_NAMES);
      const houseNumber = String(faker.number.int({ min: 1, max: 180 }));
      const zip = `${faker.number.int({ min: 1, max: 7 })}${faker.number.int({ min: 10, max: 99 })} 00`;

      const description = buildDescription(
        category,
        offerType,
        disposition,
        areaDisplay,
        locDisplay,
        amenities,
        isLongDesc,
      );

      const viewsCount =
        status === "active"
          ? faker.number.int({ min: 25, max: 680 })
          : faker.number.int({ min: 0, max: 90 });

      const [listingRow] = await db
        .insert(schema.listings)
        .values({
          slug,
          agentId: agent.userId,
          agencyId: agent.agencyId,
          status,
          rejectReason:
            status === "rejected"
              ? "Doplňte prosím energetický štítek budovy a přesnější popis stavu nemovitosti."
              : null,
          offerType,
          category,
          subtype,
          title,
          description,
          price: price !== null ? String(price) : null,
          priceUnit,
          priceNegotiable,
          priceOnRequest,
          feesMonthly: feesMonthly !== null ? String(feesMonthly) : null,
          deposit: deposit !== null ? String(deposit) : null,
          street,
          houseNumber,
          zip,
          locationId: loc.id,
          city: loc.city,
          district: loc.district,
          lat,
          lng,
          showExactLocation,
          usableArea: usableArea !== null ? usableArea.toFixed(1) : null,
          landArea: landArea !== null ? landArea.toFixed(1) : null,
          builtArea: builtArea !== null ? builtArea.toFixed(1) : null,
          floor,
          floorsTotal,
          yearBuilt,
          lastRenovation:
            condition === "after_renovation" ? faker.number.int({ min: 2016, max: 2025 }) : null,
          disposition,
          buildingType,
          condition,
          ownership,
          energyClass,
          furnished,
          amenities,
          availableFrom:
            offerType === "rent"
              ? new Date(now.getTime() + faker.number.int({ min: 1, max: 45 }) * 86_400_000)
                  .toISOString()
                  .slice(0, 10)
              : null,
          viewsCount,
          favoritesCount: 0,
          publishedAt,
          expiresAt,
          createdAt,
          updatedAt: publishedAt ?? createdAt,
        })
        .returning({ id: schema.listings.id });

      if (status === "active") {
        activeListingIds.push(listingRow!.id);
        activeListingAgentPairs.push({ id: listingRow!.id, agentId: agent.userId });
      }

      // Photos (6-14 normally, plus edge cases 1, 40, 0)
      const photoCount = isZeroPhotos
        ? 0
        : isOnePhoto
          ? 1
          : isFortyPhotos
            ? 40
            : faker.number.int({ min: 6, max: 14 });
      const chosenPhotos = selectPhotosForListing(
        photoPool,
        category,
        photoCount,
        `${formatCategoryGenitive(category)} ${dispLabel || ""}`.trim() + `, ${locDisplay}`,
      );
      chosenPhotos.forEach((p, idx) => {
        allImageRows.push({
          listingId: listingRow!.id,
          storageKey: p.meta.storageKey,
          width: p.meta.width,
          height: p.meta.height,
          blurDataUrl: p.meta.blurDataUrl,
          alt: p.alt,
          sortOrder: idx,
          isCover: p.isCover,
        });
      });

      // Price history (reduced price edge case)
      if (isReducedPrice && price !== null && publishedAt) {
        const higherOldPrice = Math.round((price * 1.07) / 10_000) * 10_000;
        allPriceHistoryRows.push(
          {
            listingId: listingRow!.id,
            price: String(higherOldPrice),
            changedAt: new Date(publishedAt.getTime() - 10 * 86_400_000),
          },
          {
            listingId: listingRow!.id,
            price: String(price),
            changedAt: new Date(publishedAt.getTime() - 2 * 86_400_000),
          },
        );
      }
    }

    // Batch insert images & price history
    const CHUNK = 500;
    for (let idx = 0; idx < allImageRows.length; idx += CHUNK) {
      await db.insert(schema.listingImages).values(allImageRows.slice(idx, idx + CHUNK));
    }
    if (allPriceHistoryRows.length > 0) {
      await db.insert(schema.listingPriceHistory).values(allPriceHistoryRows);
    }

    // 7. Seed Favorites:
    // - regularUsers[0] (uzivatel@reaporta.test): 8 favorites
    // - regularUsers[1]: 0 favorites (edge case)
    // - regularUsers[2]: 25 favorites (edge case)
    // - regularUsers[3..7]: 2-5 favorites each
    const favRows: Array<typeof schema.favorites.$inferInsert> = [];
    const addFavs = (userId: string, count: number, offset: number) => {
      for (let k = 0; k < count; k++) {
        const listingId = activeListingIds[(offset + k * 7) % activeListingIds.length]!;
        favRows.push({ userId, listingId });
      }
    };
    addFavs(regularUsers[0]!.id, 8, 0);
    // regularUsers[1] intentionally 0 favorites
    addFavs(regularUsers[2]!.id, 25, 3);
    for (let u = 3; u < regularUsers.length; u++) {
      addFavs(regularUsers[u]!.id, 3 + (u % 3), u * 11);
    }
    await db.insert(schema.favorites).values(favRows).onConflictDoNothing();

    // Sync listings.favorites_count
    await db.execute(sql`
      UPDATE listings l
      SET favorites_count = sub.cnt
      FROM (
        SELECT listing_id, COUNT(*)::int AS cnt
        FROM favorites
        GROUP BY listing_id
      ) sub
      WHERE l.id = sub.listing_id;
    `);

    // 8. Seed Saved Searches (uzivatel@reaporta.test has 2)
    await db.insert(schema.savedSearches).values([
      {
        userId: regularUsers[0]!.id,
        name: "Byty 2+kk a 3+kk v Praze do 9 mil.",
        params: {
          offerType: "sale",
          category: "flat",
          locations: ["hlavni-mesto-praha/praha/praha"],
          dispositions: ["2+kk", "3+kk"],
          priceMax: 9_000_000,
        },
        frequency: "daily",
        lastNotifiedAt: new Date(now.getTime() - 2 * 86_400_000),
      },
      {
        userId: regularUsers[0]!.id,
        name: "Pronájem v Brně s balkonem",
        params: {
          offerType: "rent",
          category: "flat",
          locations: ["jihomoravsky-kraj/brno-mesto/brno"],
          amenities: ["balcony"],
          priceMax: 25_000,
        },
        frequency: "weekly",
        lastNotifiedAt: new Date(now.getTime() - 8 * 86_400_000),
      },
    ]);

    // 9. Seed ~60 Inquiries
    const inquiryMessages = [
      "Dobrý den, měl bych zájem o osobní prohlídku této nemovitosti. Kdy by vám to prosím vyhovovalo?",
      "Dobrý den, můžete mi prosím zaslat výši měsíčních poplatků a možnosti parkování?",
      "Dobrý den, je tato nabídka stále aktuální? Rádi bychom se domluvili na termínu prohlídky v příštím týdnu.",
      "Dobrý den, zajímalo by mě, od kdy je nemovitost volná k nastěhování.",
    ];
    const inquiryRows: Array<typeof schema.inquiries.$inferInsert> = [];
    for (let q = 0; q < 60; q++) {
      const target = activeListingAgentPairs[(q * 5) % activeListingAgentPairs.length]!;
      const regUser = q % 3 === 0 ? regularUsers[q % regularUsers.length]! : null;
      const senderName = regUser ? regUser.name : faker.person.fullName();
      const senderEmail = regUser ? regUser.email : `${slugify(senderName)}.zajemce@example.test`;
      inquiryRows.push({
        listingId: target.id,
        agentId: target.agentId,
        userId: regUser ? regUser.id : null,
        name: senderName,
        email: senderEmail,
        phone: `+420 60${(q % 8) + 1} ${String(100 + q * 7).padStart(3, "0")} ${String(200 + q * 9).padStart(3, "0")}`,
        message: inquiryMessages[q % inquiryMessages.length]!,
        status: faker.helpers.arrayElement(["new", "new", "read", "replied", "archived"]),
        ipHash: crypto
          .createHash("sha256")
          .update(`192.0.2.${(q % 250) + 1}`)
          .digest("hex"),
        createdAt: new Date(now.getTime() - faker.number.int({ min: 0, max: 25 }) * 86_400_000),
      });
    }
    await db.insert(schema.inquiries).values(inquiryRows);

    // 10. Seed 5 Reports
    const reportReasons: Array<"fraud" | "duplicate" | "wrong_info" | "sold" | "other"> = [
      "wrong_info",
      "duplicate",
      "sold",
      "fraud",
      "other",
    ];
    await db.insert(schema.reports).values(
      reportReasons.map((reason, idx) => ({
        listingId: activeListingIds[idx * 17]!,
        reporterUserId: idx % 2 === 0 ? regularUsers[0]!.id : null,
        reason,
        details: "Uvedená výměra nebo dostupnost pravděpodobně neodpovídá aktuálnímu stavu.",
        status: idx < 3 ? ("open" as const) : ("resolved" as const),
        resolvedBy: idx >= 3 ? adminUser!.id : null,
      })),
    );

    // 11. Seed 30 days of listing_daily_stats for all active listings
    const statsRows: Array<typeof schema.listingDailyStats.$inferInsert> = [];
    for (const listingId of activeListingIds) {
      for (let d = 0; d < 30; d++) {
        const day = new Date(now.getTime() - d * 86_400_000).toISOString().slice(0, 10);
        statsRows.push({
          listingId,
          day,
          views: faker.number.int({ min: 1, max: 28 }),
          phoneReveals: faker.number.int({ min: 0, max: 3 }),
        });
      }
    }
    for (let idx = 0; idx < statsRows.length; idx += 1000) {
      await db.insert(schema.listingDailyStats).values(statsRows.slice(idx, idx + 1000));
    }

    // 12. Update locations.listing_count_cache (including ancestor rollup via full_slug)
    await db.execute(sql`
      UPDATE locations loc
      SET listing_count_cache = (
        SELECT COUNT(*)::int
        FROM listings l
        JOIN locations leaf ON leaf.id = l.location_id
        WHERE l.status = 'active'
          AND (leaf.id = loc.id OR leaf.full_slug LIKE loc.full_slug || '/%')
      );
    `);

    const elapsedSec = ((Date.now() - started) / 1000).toFixed(2);
    console.log(
      `Seed hotov za ${elapsedSec} s: ${krajCount} krajů, ${okresCount} okresů, ${obecCount} obcí, ${castCount} částí | 400 inzerátů (${activeListingIds.length} aktivních) | ${allImageRows.length} fotek | ${inquiryRows.length} poptávek | ${statsRows.length} denních statistik.`,
    );
    // Keep unused warning quiet
    void eq;
    void allObceIds;
  } finally {
    await pool.end();
  }
}

const isDirectRun = process.argv[1] !== undefined && process.argv[1].endsWith("seed.ts");

if (isDirectRun) {
  runSeed().catch((err) => {
    console.error("Chyba při seedu:", err);
    process.exit(1);
  });
}
