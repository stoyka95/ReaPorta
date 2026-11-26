import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getUserFavoritesWithStatus } from "@/db/queries/account";
import { FavoritesClient } from "@/components/account/FavoritesClient";

export const metadata: Metadata = {
  title: "Oblíbené nabídky",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await requirePageUser("/ucet/oblibene");
  const items = await getUserFavoritesWithStatus(user.id);

  return <FavoritesClient initialItems={items} />;
}
