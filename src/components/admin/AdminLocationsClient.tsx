"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search } from "lucide-react";
import type { AdminLocationItem } from "@/db/queries/admin";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Input,
  SegmentedControl,
  useToast,
} from "@/components/ui";
import { formatNumber } from "@/lib/format";

interface AdminLocationsClientProps {
  initialLocations: AdminLocationItem[];
}

const TYPE_LABELS: Record<AdminLocationItem["type"], string> = {
  kraj: "Kraj",
  okres: "Okres",
  obec: "Obec",
  cast: "Část obce",
};

export function AdminLocationsClient({ initialLocations }: AdminLocationsClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = React.useState(initialLocations);
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | AdminLocationItem["type"]>("all");
  const [editTarget, setEditTarget] = React.useState<AdminLocationItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editLat, setEditLat] = React.useState("");
  const [editLng, setEditLng] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((loc) => {
      if (typeFilter !== "all" && loc.type !== typeFilter) return false;
      if (!q) return true;
      return loc.name.toLowerCase().includes(q) || loc.fullSlug.toLowerCase().includes(q);
    });
  }, [items, query, typeFilter]);

  function openEdit(loc: AdminLocationItem) {
    setEditTarget(loc);
    setEditName(loc.name);
    setEditLat(String(loc.lat));
    setEditLng(String(loc.lng));
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const lat = Number.parseFloat(editLat);
    const lng = Number.parseFloat(editLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Zadejte platné číselné souřadnice zeměpisné šířky a délky.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/locations/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), lat, lng }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Uložení lokality selhalo.");
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === editTarget.id ? { ...item, name: editName.trim(), lat, lng } : item,
        ),
      );
      push({ tone: "success", title: `Lokalita „${editName.trim()}“ byla upravena` });
      setEditTarget(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="w-full max-w-md">
          <Input
            label="Vyhledat lokalitu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Název nebo slug (např. Praha, Brno)…"
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
        <SegmentedControl
          ariaLabel="Filtr typu lokality"
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as "all" | AdminLocationItem["type"])}
          options={[
            { value: "all", label: "Vše" },
            { value: "kraj", label: "Kraje" },
            { value: "okres", label: "Okresy" },
            { value: "obec", label: "Obce" },
            { value: "cast", label: "Části" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Žádné lokality k zobrazení"
          description="Zkuste změnit vyhledávací dotaz nebo typ lokality."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line-subtle bg-subtle type-caption font-semibold text-muted">
                  <th className="px-4 py-3">Název</th>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Souřadnice (lat, lng)</th>
                  <th className="px-4 py-3">Inzeráty</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle type-small">
                {filtered.map((loc) => (
                  <tr key={loc.id} className="hover:bg-hover/50">
                    <td className="px-4 py-3 font-medium text-strong">{loc.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{TYPE_LABELS[loc.type]}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono type-caption text-muted">{loc.fullSlug}</td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-body tabular-nums">
                      {formatNumber(loc.listingsCount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
                        onClick={() => openEdit(loc)}
                      >
                        Upravit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent
          title="Upravit lokalitu"
          description={
            editTarget
              ? `Slug: ${editTarget.fullSlug} (${TYPE_LABELS[editTarget.type]})`
              : undefined
          }
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Název lokality"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Zeměpisná šířka (lat)"
                type="number"
                step="0.0001"
                value={editLat}
                onChange={(e) => setEditLat(e.target.value)}
                required
              />
              <Input
                label="Zeměpisná délka (lng)"
                type="number"
                step="0.0001"
                value={editLng}
                onChange={(e) => setEditLng(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p role="alert" className="type-small text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>
                Zrušit
              </Button>
              <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                Uložit změny
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
