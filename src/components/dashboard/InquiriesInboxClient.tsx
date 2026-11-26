"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Check, ExternalLink, Mail, Phone, Reply } from "lucide-react";
import type { AgentInquiryRow, InquiryStatus } from "@/db/queries/profiles";
import { Badge, Button, Card, EmptyState, useToast } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATUS_TABS: Array<{ value: "all" | InquiryStatus; label: string }> = [
  { value: "all", label: "Vše" },
  { value: "new", label: "Nové" },
  { value: "read", label: "Přečtené" },
  { value: "replied", label: "Zodpovězené" },
  { value: "archived", label: "Archiv" },
];

const STATUS_BADGE: Record<
  InquiryStatus,
  { label: string; variant: "new" | "success" | "neutral" | "warning" }
> = {
  new: { label: "Nová", variant: "new" },
  read: { label: "Přečtená", variant: "neutral" },
  replied: { label: "Zodpovězená", variant: "success" },
  archived: { label: "Archiv", variant: "neutral" },
};

export function InquiriesInboxClient({ initialItems }: { initialItems: AgentInquiryRow[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [items, setItems] = React.useState(initialItems);
  const [filter, setFilter] = React.useState<"all" | InquiryStatus>("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const counts = React.useMemo(() => {
    const map: Record<"all" | InquiryStatus, number> = {
      all: items.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };
    for (const item of items) {
      map[item.status] += 1;
    }
    return map;
  }, [items]);

  const visible = React.useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [items, filter],
  );

  async function updateStatus(id: string, status: InquiryStatus) {
    setBusyId(id);
    const prev = items;
    setItems((curr) => curr.map((item) => (item.id === id ? { ...item, status } : item)));
    try {
      const res = await fetch(`/api/dashboard/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed");
      push({ tone: "success", title: "Stav poptávky byl aktualizován." });
      router.refresh();
    } catch {
      setItems(prev);
      push({ tone: "danger", title: "Stav poptávky se nepodařilo změnit." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1 text-strong">Schránka poptávek</h1>
        <p className="mt-1 type-small text-muted">
          Odpovídejte zájemcům a udržujte si přehled o vyřízených poptávkách.
        </p>
      </div>

      {/* Filtry stavu s počítadly */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const active = filter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-pill px-4 type-small font-medium transition-colors cursor-pointer",
                active
                  ? "bg-accent text-on-accent shadow-accent"
                  : "border border-line bg-surface text-body hover:bg-hover",
              )}
            >
              <span>{tab.label}</span>
              <span className="tnum opacity-80">({counts[tab.value]})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="V této složce nejsou žádné poptávky."
          description="Nové zprávy od zájemců se zde zobrazí ihned po odeslání z detailu nabídky."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((inq) => {
            const meta = STATUS_BADGE[inq.status];
            const isBusy = busyId === inq.id;
            const mailtoHref = `mailto:${encodeURIComponent(inq.email)}?subject=${encodeURIComponent(
              `Re: ${inq.listingTitle}`,
            )}`;

            return (
              <Card
                key={inq.id}
                padding="md"
                data-inquiry-id={inq.id}
                data-inquiry-status={inq.status}
                className={cn("space-y-4", inq.status === "new" && "border-violet-300")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="type-h3 text-strong">{inq.name}</h2>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-small text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {inq.email}
                      </span>
                      {inq.phone ? (
                        <span className="inline-flex items-center gap-1.5 tnum">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          {inq.phone}
                        </span>
                      ) : null}
                      <span className="tnum">{formatDate(inq.createdAt)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/nemovitost/${inq.listingSlug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-subtle px-3 py-1.5 type-caption font-medium text-strong hover:bg-hover"
                  >
                    <span className="max-w-56 truncate">{inq.listingTitle}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                  </Link>
                </div>

                <p className="rounded-lg bg-subtle p-3.5 type-body text-body whitespace-pre-line">
                  {inq.message}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Reply className="h-4 w-4" aria-hidden="true" />}
                    asChild
                    onClick={() => {
                      if (inq.status !== "replied") {
                        void updateStatus(inq.id, "replied");
                      }
                    }}
                  >
                    <a href={mailtoHref}>Odpovědět e-mailem</a>
                  </Button>

                  {inq.status === "new" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isBusy}
                      leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void updateStatus(inq.id, "read")}
                    >
                      Označit jako přečtenou
                    </Button>
                  ) : null}

                  {inq.status !== "replied" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void updateStatus(inq.id, "replied")}
                    >
                      Označit jako zodpovězenou
                    </Button>
                  ) : null}

                  {inq.status !== "archived" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      leftIcon={<Archive className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void updateStatus(inq.id, "archived")}
                    >
                      Archivovat
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
