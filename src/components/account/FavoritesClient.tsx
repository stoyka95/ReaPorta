"use client";

import * as React from "react";
import Link from "next/link";
import type { FavoriteListingEntry } from "@/db/queries/account";
import { Badge, Button, EmptyState } from "@/components/ui";
import { ListingCard } from "@/components/listing/ListingCard";
import { useSession } from "@/components/auth/SessionProvider";
import { formatPrice } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  sold: "Prodáno",
  expired: "Nabídka vypršela",
  paused: "Pozastaveno",
};

export function FavoritesClient({ initialItems }: { initialItems: FavoriteListingEntry[] }) {
  const { favoriteIds, loading } = useSession();
  const [items, setItems] = React.useState(initialItems);

  const displayItems = React.useMemo(
    () => (loading ? items : items.filter((entry) => favoriteIds.has(entry.listing.id))),
    [items, favoriteIds, loading],
  );

  function handleRemoved(listingId: string) {
    setItems((prev) => prev.filter((item) => item.listing.id !== listingId));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-strong">Oblíbené nabídky</h1>
        <p className="mt-1 type-small text-muted">
          Přehled uložených nemovitostí včetně upozornění na změnu ceny nebo stavu.
        </p>
      </div>

      {displayItems.length === 0 ? (
        <EmptyState
          title="Zatím tu nic nemáte."
          description="Srdíčkem si uložíte nabídky, ke kterým se chcete vrátit."
          action={
            <Button variant="primary" asChild>
              <Link href="/prodej/vse">Procházet nabídky</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((entry) => (
            <div key={entry.listing.id} className="flex flex-col gap-2">
              {entry.status !== "active" || entry.priceChangeSinceSaved !== null ? (
                <div className="flex flex-wrap items-center gap-1.5 px-1">
                  {entry.status !== "active" ? (
                    <Badge variant="warning">{STATUS_LABELS[entry.status] ?? "Neaktivní"}</Badge>
                  ) : null}
                  {entry.priceChangeSinceSaved !== null ? (
                    <Badge variant={entry.priceChangeSinceSaved < 0 ? "success" : "warning"}>
                      {entry.priceChangeSinceSaved < 0 ? "Zlevněno o " : "Zdraženo o "}
                      {formatPrice(Math.abs(entry.priceChangeSinceSaved), "total")}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              <ListingCard
                listing={entry.listing}
                onFavoriteClick={() => handleRemoved(entry.listing.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
