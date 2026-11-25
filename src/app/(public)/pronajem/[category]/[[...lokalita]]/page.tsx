import { renderListingStubPage } from "@/features/search/render-stub";

export default async function RentListingsPage({
  params,
}: {
  params: Promise<{ category: string; lokalita?: string[] }>;
}) {
  const { category, lokalita } = await params;
  return renderListingStubPage({ offerType: "rent", categorySlug: category, lokalita });
}
