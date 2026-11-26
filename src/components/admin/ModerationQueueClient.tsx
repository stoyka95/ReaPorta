"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Image as ImageIcon, XCircle } from "lucide-react";
import type { ModerationQueueItem } from "@/db/queries/admin";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  EmptyState,
  Textarea,
  useToast,
} from "@/components/ui";
import { formatArea, formatDate, formatPrice } from "@/lib/format";
import { getImageVariantUrl } from "@/lib/media-url";

interface ModerationQueueClientProps {
  initialItems: ModerationQueueItem[];
}

export function ModerationQueueClient({ initialItems }: ModerationQueueClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = React.useState(initialItems);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<ModerationQueueItem | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectError, setRejectError] = React.useState<string | null>(null);

  async function handleApprove(item: ModerationQueueItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/admin/moderation/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approve" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: "Schválení selhalo", description: data.error });
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      push({
        tone: "success",
        title: "Inzerát byl schválen",
        description: `Nabídka „${item.title}“ je nyní aktivní a makléři byl odeslán e-mail.`,
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setRejectError("Uveďte prosím srozumitelný důvod zamítnutí (alespoň 5 znaků).");
      return;
    }

    setBusyId(rejectTarget.id);
    setRejectError(null);
    try {
      const res = await fetch(`/api/admin/moderation/${rejectTarget.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "reject", reason: rejectReason.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setRejectError(data.error ?? "Zamítnutí inzerátu selhalo.");
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== rejectTarget.id));
      push({
        tone: "info",
        title: "Inzerát byl zamítnut",
        description: "Makléři byl odeslán e-mail s uvedeným důvodem.",
      });
      setRejectTarget(null);
      setRejectReason("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Fronta moderace je prázdná"
        description="Všechny inzeráty čekající na schválení byly vyřízeny."
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          const thumbUrl = item.coverKey ? getImageVariantUrl(item.coverKey, "thumb") : null;
          const isBusy = busyId === item.id;
          return (
            <Card
              key={item.id}
              padding="md"
              className="flex flex-col gap-4 md:flex-row md:items-center"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-subtle md:h-24 md:w-36">
                {thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <ImageIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Čeká na schválení</Badge>
                  <Badge variant="neutral">
                    {item.offerType === "sale" ? "Prodej" : "Pronájem"}
                  </Badge>
                  <span className="type-caption text-muted tabular-nums">
                    {item.imagesCount} fotek · odesláno {formatDate(item.updatedAt)}
                  </span>
                </div>
                <h2 className="type-h3 text-strong">{item.title}</h2>
                <p className="type-small text-body">
                  <strong className="font-semibold text-strong tabular-nums">
                    {formatPrice(item.price, item.priceUnit, {
                      priceOnRequest: item.priceOnRequest,
                    })}
                  </strong>
                  {item.usableArea ? ` · ${formatArea(item.usableArea)}` : ""} · {item.city}
                  {item.district ? ` – ${item.district}` : ""}
                </p>
                <p className="type-caption text-muted">
                  Makléř: {item.agentName} ({item.agentEmail})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                  asChild
                >
                  <Link href={`/nemovitost/${item.slug}`} target="_blank" rel="noreferrer">
                    Náhled
                  </Link>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={isBusy}
                  disabled={isBusy}
                  leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => handleApprove(item)}
                >
                  Schválit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isBusy}
                  leftIcon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    setRejectTarget(item);
                    setRejectReason("");
                    setRejectError(null);
                  }}
                >
                  Zamítnout
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectError(null);
          }
        }}
      >
        <DialogContent
          title="Zamítnout inzerát"
          description={
            rejectTarget
              ? `Inzerát „${rejectTarget.title}“ se vrátí makléři k úpravě s důvodem níže.`
              : undefined
          }
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <Textarea
              label="Důvod zamítnutí (zobrazí se makléři i v e-mailu)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Např. doplňte prosím alespoň 3 fotografie interiéru a energetický štítek PENB."
              error={rejectError ?? undefined}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRejectTarget(null)}>
                Zrušit
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={busyId !== null}
                disabled={busyId !== null}
              >
                Potvrdit zamítnutí
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
