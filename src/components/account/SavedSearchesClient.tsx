"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import type { SavedSearchFrequency, SavedSearchItem } from "@/db/queries/account";
import { Button, Card, EmptyState, Select, useToast } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface SavedSearchRow extends SavedSearchItem {
  href: string;
}

export function SavedSearchesClient({ initialItems }: { initialItems: SavedSearchRow[] }) {
  const { push } = useToast();
  const [items, setItems] = React.useState(initialItems);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleFrequencyChange(id: string, frequency: SavedSearchFrequency) {
    setBusyId(id);
    const prevItems = items;
    setItems((curr) => curr.map((item) => (item.id === id ? { ...item, frequency } : item)));

    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency }),
      });
      if (!res.ok) throw new Error("patch_failed");
      push({ tone: "success", title: "Frekvence upozornění uložena." });
    } catch {
      setItems(prevItems);
      push({ tone: "danger", title: "Změnu se nepodařilo uložit." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setItems((curr) => curr.filter((item) => item.id !== id));
      push({ tone: "info", title: "Uložené hledání bylo smazáno." });
    } catch {
      push({ tone: "danger", title: "Hledání se nepodařilo smazat." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-strong">Uložená hledání</h1>
        <p className="mt-1 type-small text-muted">
          Hlídací pes vám pošle souhrn nových nabídek podle zvolené frekvence.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Zatím nemáte žádná uložená hledání."
          description="Na stránce výpisu nastavte filtry a klikněte na Uložit hledání."
          action={
            <Button variant="primary" asChild>
              <Link href="/prodej/byty">Nastavit filtry ve výpisu</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              padding="md"
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              data-saved-search-id={item.id}
            >
              <div className="min-w-0 space-y-1">
                <h2 className="truncate type-h3 text-strong">{item.name}</h2>
                <p className="type-caption text-muted">
                  Vytvořeno {formatDate(item.createdAt)}
                  {item.lastNotifiedAt
                    ? ` · Poslední upozornění ${formatDate(item.lastNotifiedAt)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-40">
                  <Select
                    aria-label={`Frekvence upozornění pro ${item.name}`}
                    value={item.frequency}
                    disabled={busyId === item.id}
                    onValueChange={(v) => handleFrequencyChange(item.id, v as SavedSearchFrequency)}
                    options={[
                      { value: "instant", label: "Ihned" },
                      { value: "daily", label: "Denně" },
                      { value: "weekly", label: "Týdně" },
                      { value: "off", label: "Vypnuto" },
                    ]}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                  asChild
                >
                  <Link href={item.href}>Otevřít</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  aria-label={`Smazat hledání ${item.name}`}
                  disabled={busyId === item.id}
                  leftIcon={<Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />}
                  onClick={() => handleDelete(item.id)}
                >
                  Smazat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
