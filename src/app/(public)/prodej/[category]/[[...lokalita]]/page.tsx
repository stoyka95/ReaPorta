import type { Metadata } from "next";
import { generateSearchMetadata, renderSearchPage } from "@/features/search/render-search-page";

interface PageProps {
  params: Promise<{ category: string; lokalita?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category, lokalita } = await params;
  const sp = await searchParams;
  return generateSearchMetadata({
    offerType: "sale",
    categorySlug: category,
    lokalita,
    searchParams: sp,
  });
}

export default async function SaleSearchPage({ params, searchParams }: PageProps) {
  const { category, lokalita } = await params;
  const sp = await searchParams;
  return renderSearchPage({
    offerType: "sale",
    categorySlug: category,
    lokalita,
    searchParams: sp,
  });
}
