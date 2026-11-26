import type { MetadataRoute } from "next";
import { getSitemapData } from "@/db/queries/seo";

export const dynamic = "force-dynamic";

const OFFER_SLUGS = ["prodej", "pronajem"] as const;
const CATEGORY_SLUGS = ["byty", "domy", "pozemky", "komercni", "ostatni"] as const;
const STATIC_PATHS = [
  "",
  "/makleri",
  "/inzerce",
  "/o-nas",
  "/kontakt",
  "/podminky",
  "/ochrana-udaju",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  const data = await getSitemapData(10_000, 0);

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${baseUrl}${path || "/"}`,
      lastModified: now,
      changeFrequency: path === "" ? "hourly" : "monthly",
      priority: path === "" ? 1.0 : 0.6,
    });
  }

  for (const offer of OFFER_SLUGS) {
    for (const cat of CATEGORY_SLUGS) {
      entries.push({
        url: `${baseUrl}/${offer}/${cat}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });

      for (const city of data.topCities.slice(0, 12)) {
        entries.push({
          url: `${baseUrl}/${offer}/${cat}/${city.slug}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }
  }

  for (const agent of data.agents) {
    entries.push({
      url: `${baseUrl}/makleri/${agent.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const agency of data.agencies) {
    entries.push({
      url: `${baseUrl}/agentury/${agency.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const listing of data.activeListings) {
    entries.push({
      url: `${baseUrl}/nemovitost/${listing.slug}`,
      lastModified: listing.updatedAt,
      changeFrequency: "daily",
      priority: 0.85,
    });
  }

  return entries;
}
