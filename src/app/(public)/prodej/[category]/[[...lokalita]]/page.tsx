import { renderListingStubPage } from "@/features/search/render-stub";

export default async function SaleListingsPage({
  params,
}: {
  params: Promise<{ category: string; lokalita?: string[] }>;
}) {
  const { category, lokalita } = await params;
  return renderListingStubPage({ offerType: "sale", categorySlug: category, lokalita });
}
