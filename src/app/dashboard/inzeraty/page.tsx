import type { Metadata } from "next";
import { requirePageAgent } from "@/lib/auth/session";
import { getAgentListings } from "@/db/queries/dashboard";
import { ListingsTableClient } from "@/components/dashboard/ListingsTableClient";

export const metadata: Metadata = {
  title: "Moje inzeráty — Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stav?: string; q?: string; razeni?: string }>;
}) {
  const user = await requirePageAgent("/dashboard/inzeraty");
  const sp = await searchParams;
  const rows = await getAgentListings(user.id);

  return (
    <ListingsTableClient
      initialListings={rows}
      initialStatus={sp.stav ?? "all"}
      initialQuery={sp.q ?? ""}
      initialSort={sp.razeni ?? "updated_desc"}
    />
  );
}
