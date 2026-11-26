import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getUserSavedSearches } from "@/db/queries/account";
import { buildSearchUrlFromParams } from "@/lib/alerts";
import { SavedSearchesClient } from "@/components/account/SavedSearchesClient";

export const metadata: Metadata = {
  title: "Uložená hledání",
  robots: { index: false, follow: false },
};

export default async function SavedSearchesPage() {
  const user = await requirePageUser("/ucet/hledani");
  const rows = await getUserSavedSearches(user.id);
  const items = rows.map((row) => ({
    ...row,
    href: buildSearchUrlFromParams(row.params),
  }));

  return <SavedSearchesClient initialItems={items} />;
}
