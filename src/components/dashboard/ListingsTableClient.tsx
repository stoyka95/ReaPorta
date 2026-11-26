"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  ImageOff,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { AgentListingRow } from "@/db/queries/dashboard";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  EmptyState,
  Input,
  Select,
  useToast,
} from "@/components/ui";
import { formatDate, formatPrice } from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";
import { cn } from "@/lib/cn";

const STATUS_META: Record<
  AgentListingRow["status"],
  { label: string; variant: "new" | "success" | "warning" | "danger" | "neutral" }
> = {
  active: { label: "Aktivní", variant: "success" },
  pending: { label: "Ke schválení", variant: "warning" },
  draft: { label: "Koncept", variant: "neutral" },
  paused: { label: "Pozastaveno", variant: "neutral" },
  sold: { label: "Prodáno", variant: "new" },
  expired: { label: "Expirováno", variant: "warning" },
  rejected: { label: "Zamítnuto", variant: "danger" },
};

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Vše" },
  { value: "active", label: "Aktivní" },
  { value: "pending", label: "Ke schválení" },
  { value: "draft", label: "Koncepty" },
  { value: "paused", label: "Pozastavené" },
  { value: "sold", label: "Prodáno" },
  { value: "expired", label: "Expirované" },
  { value: "rejected", label: "Zamítnuté" },
];

export function ListingsTableClient({
  initialListings,
  initialStatus = "all",
  initialQuery = "",
  initialSort = "updated_desc",
}: {
  initialListings: AgentListingRow[];
  initialStatus?: string;
  initialQuery?: string;
  initialSort?: string;
}) {
  const router = useRouter();
  const { push } = useToast();

  const [rows, setRows] = React.useState(initialListings);
  const [statusFilter, setStatusFilter] = React.useState(initialStatus);
  const [query, setQuery] = React.useState(initialQuery);
  const [sort, setSort] = React.useState(initialSort);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AgentListingRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setRows(initialListings);
  }, [initialListings]);

  const filtered = React.useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.city.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    if (sort === "views_desc") sorted.sort((a, b) => b.viewsCount - a.viewsCount);
    else if (sort === "price_desc") sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else if (sort === "price_asc") sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return sorted;
  }, [rows, statusFilter, query, sort]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.id)));
    }
  }

  async function handleStatusAction(id: string, action: "pause" | "resume" | "sold" | "extend") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dashboard/listings/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { status: AgentListingRow["status"] };
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
      push({ tone: "success", title: "Stav inzerátu byl změněn." });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Stav se nepodařilo změnit." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dashboard/listings/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("failed");
      push({ tone: "success", title: "Inzerát byl zduplikován jako koncept." });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Duplikace se nezdařila." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    try {
      const res = await fetch(`/api/dashboard/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteTarget(null);
      push({ tone: "info", title: "Inzerát byl smazán." });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Inzerát se nepodařilo smazat." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulk(action: "pause" | "resume" | "delete") {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/dashboard/listings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error("failed");
      if (action === "delete") {
        setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      } else {
        const nextStatus = action === "pause" ? "paused" : "active";
        setRows((prev) =>
          prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: nextStatus } : r)),
        );
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      push({ tone: "success", title: `Hromadná akce provedena (${ids.length}).` });
      router.refresh();
    } catch {
      push({ tone: "danger", title: "Hromadná akce se nezdařila." });
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-strong">Moje inzeráty</h1>
          <p className="mt-1 type-small text-muted">
            Spravujte své nabídky, sledujte stav moderace a upravujte ceny.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          asChild
        >
          <Link href="/dashboard/inzeraty/novy">Nový inzerát</Link>
        </Button>
      </div>

      {/* Filtry stavu */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((sf) => {
          const active = statusFilter === sf.value;
          return (
            <button
              key={sf.value}
              type="button"
              onClick={() => setStatusFilter(sf.value)}
              className={cn(
                "inline-flex h-9 items-center rounded-pill px-3.5 type-small font-medium transition-colors cursor-pointer",
                active
                  ? "bg-accent text-on-accent shadow-accent"
                  : "border border-line bg-surface text-body hover:bg-hover",
              )}
            >
              {sf.label}
            </button>
          );
        })}
      </div>

      {/* Hledání + řazení */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            aria-label="Hledat v inzerátech"
            placeholder="Hledat podle názvu nebo města…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            aria-label="Řazení inzerátů"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "updated_desc", label: "Naposledy upravené" },
              { value: "views_desc", label: "Nejvíce zobrazení" },
              { value: "price_desc", label: "Nejdražší" },
              { value: "price_asc", label: "Nejlevnější" },
            ]}
          />
        </div>
      </div>

      {/* Hromadné akce */}
      {selectedIds.size > 0 ? (
        <Card
          padding="sm"
          className="flex flex-wrap items-center justify-between gap-3 bg-violet-50 border-violet-200"
        >
          <span className="type-small font-medium text-violet-900 tnum">
            Vybráno: {selectedIds.size}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={bulkBusy}
              onClick={() => handleBulk("pause")}
            >
              Pozastavit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={bulkBusy}
              onClick={() => handleBulk("resume")}
            >
              Obnovit
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={bulkBusy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              Smazat vybrané
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Seznam */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Žádné inzeráty neodpovídají filtru."
          description="Zkuste vybrat jiný stav nebo vložte novou nabídku."
          action={
            <Button variant="primary" asChild>
              <Link href="/dashboard/inzeraty/novy">Vložit nový inzerát</Link>
            </Button>
          }
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-subtle">
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      aria-label="Vybrat všechny inzeráty"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-2.5 py-3 type-caption font-semibold text-muted">Nabídka</th>
                  <th className="px-2.5 py-3 type-caption font-semibold text-muted">Stav</th>
                  <th className="px-2.5 py-3 type-caption font-semibold text-muted">Cena</th>
                  <th className="px-2.5 py-3 type-caption font-semibold text-muted">Zobr.</th>
                  <th className="px-3 py-3 text-right type-caption font-semibold text-muted">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {filtered.map((row) => {
                  const meta = STATUS_META[row.status];
                  const isBusy = busyId === row.id;
                  return (
                    <tr
                      key={row.id}
                      data-listing-row={row.id}
                      className="transition-colors hover:bg-hover/60"
                    >
                      <td className="px-3 py-3 align-middle">
                        <Checkbox
                          aria-label={`Vybrat ${row.title}`}
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                            {row.coverKey ? (
                              <Image
                                src={getImageVariantUrl(row.coverKey, "thumb")}
                                alt={row.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted">
                                <ImageOff className="h-4 w-4" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-52">
                            <Link
                              href={`/dashboard/inzeraty/${row.id}/upravit`}
                              className="block truncate type-small font-semibold text-strong hover:text-accent-text hover:underline"
                            >
                              {row.title}
                            </Link>
                            <p className="truncate type-caption text-muted">
                              {row.district ?? row.city} · {formatDate(row.updatedAt)}
                            </p>
                            {row.status === "rejected" && row.rejectReason ? (
                              <p className="mt-0.5 truncate type-caption text-danger">
                                Zamítnuto: {row.rejectReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 py-3 align-middle whitespace-nowrap">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-2.5 py-3 align-middle type-small font-semibold text-strong tnum whitespace-nowrap">
                        {formatPrice(row.price, row.priceUnit, {
                          priceOnRequest: row.priceOnRequest,
                        })}
                      </td>
                      <td className="px-2.5 py-3 align-middle type-small text-body tnum">
                        {row.viewsCount.toLocaleString("cs-CZ")}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/dashboard/inzeraty/${row.id}/upravit`}
                            aria-label={`Upravit ${row.title}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-body transition-colors hover:bg-hover hover:text-strong"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/nemovitost/${row.slug}`}
                            aria-label={`Zobrazit detail ${row.title}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-body transition-colors hover:bg-hover hover:text-strong"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {row.status === "active" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 px-0"
                                disabled={isBusy}
                                aria-label={`Pozastavit ${row.title}`}
                                onClick={() => handleStatusAction(row.id, "pause")}
                              >
                                <Pause className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 px-0"
                                disabled={isBusy}
                                aria-label={`Označit jako prodáno ${row.title}`}
                                onClick={() => handleStatusAction(row.id, "sold")}
                              >
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </>
                          ) : row.status === "paused" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 px-0"
                              disabled={isBusy}
                              aria-label={`Obnovit ${row.title}`}
                              onClick={() => handleStatusAction(row.id, "resume")}
                            >
                              <Play className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          ) : row.status === "expired" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 px-0"
                              disabled={isBusy}
                              aria-label={`Prodloužit ${row.title}`}
                              onClick={() => handleStatusAction(row.id, "extend")}
                            >
                              <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 px-0"
                            disabled={isBusy}
                            aria-label={`Duplikovat ${row.title}`}
                            onClick={() => handleDuplicate(row.id)}
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 px-0"
                            disabled={isBusy}
                            aria-label={`Smazat ${row.title}`}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4 text-danger" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Potvrzení smazání jednoho inzerátu */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent
          title="Smazat inzerát?"
          description="Tuto akci nelze vrátit zpět. Inzerát včetně nahraných fotografií bude trvale odstraněn."
        >
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Zrušit</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={deleteTarget !== null && busyId === deleteTarget.id}
              onClick={handleDeleteConfirmed}
            >
              Smazat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Potvrzení hromadného smazání */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent
          title={`Smazat vybrané inzeráty (${selectedIds.size})?`}
          description="Tuto akci nelze vrátit zpět."
        >
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Zrušit</Button>
            </DialogClose>
            <Button variant="danger" loading={bulkBusy} onClick={() => handleBulk("delete")}>
              Smazat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
