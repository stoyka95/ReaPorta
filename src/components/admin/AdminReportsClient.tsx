"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, EyeOff } from "lucide-react";
import type { AdminReportItem } from "@/db/queries/admin";
import { Badge, Button, Card, EmptyState, useToast } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface AdminReportsClientProps {
  initialReports: AdminReportItem[];
}

const REASON_LABELS: Record<AdminReportItem["reason"], string> = {
  fraud: "Podezření na podvod",
  duplicate: "Duplicitní inzerát",
  wrong_info: "Chybné informace",
  sold: "Již prodáno / pronajato",
  other: "Jiný důvod",
};

const STATUS_BADGE: Record<
  AdminReportItem["status"],
  { label: string; variant: "danger" | "success" | "neutral" }
> = {
  open: { label: "Otevřené", variant: "danger" },
  resolved: { label: "Vyřešeno (skryto)", variant: "success" },
  dismissed: { label: "Zamítnuto", variant: "neutral" },
};

const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "koncept",
  pending: "čeká na schválení",
  active: "aktivní",
  paused: "pozastavený",
  sold: "prodáno / pronajato",
  rejected: "zamítnutý",
  expired: "expirovaný",
};

export function AdminReportsClient({ initialReports }: AdminReportsClientProps) {
  const router = useRouter();
  const { push } = useToast();
  const [reports, setReports] = React.useState(initialReports);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function resolve(report: AdminReportItem, action: "hide_listing" | "dismiss") {
    setBusyId(report.id);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        push({ tone: "danger", title: "Vyřešení selhalo", description: data.error });
        return;
      }

      setReports((prev) =>
        prev.map((r) => {
          if (r.id !== report.id) return r;
          return {
            ...r,
            status: action === "hide_listing" ? "resolved" : "dismissed",
            listingStatus: action === "hide_listing" ? "paused" : r.listingStatus,
          };
        }),
      );
      push({
        tone: "success",
        title:
          action === "hide_listing"
            ? "Inzerát byl skryt z veřejných výpisů"
            : "Nahlášení zamítnuto",
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (reports.length === 0) {
    return <EmptyState title="Žádná nahlášení" description="Zatím nebyl nahlášen žádný inzerát." />;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const badge = STATUS_BADGE[report.status];
        const isBusy = busyId === report.id;
        return (
          <Card
            key={report.id}
            padding="md"
            className={report.status === "open" ? "border-violet-300" : undefined}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <Badge variant="neutral">{REASON_LABELS[report.reason]}</Badge>
                  <span className="type-caption text-muted tabular-nums">
                    {formatDate(report.createdAt)} · stav inzerátu:{" "}
                    {LISTING_STATUS_LABELS[report.listingStatus] ?? report.listingStatus}
                  </span>
                </div>
                <h2 className="type-h3 text-strong">{report.listingTitle}</h2>
                <p className="type-caption text-muted">
                  Lokalita: {report.listingCity}
                  {report.reporterEmail
                    ? ` · nahlásil: ${report.reporterName ?? report.reporterEmail}`
                    : " · anonymní nahlášení"}
                </p>
                {report.details ? (
                  <p className="mt-2 rounded-lg bg-subtle p-3 type-small text-body">
                    {report.details}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ExternalLink className="h-4 w-4" aria-hidden="true" />}
                  asChild
                >
                  <Link href={`/nemovitost/${report.listingSlug}`} target="_blank" rel="noreferrer">
                    Zobrazit inzerát
                  </Link>
                </Button>
                {report.status === "open" ? (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={isBusy}
                      disabled={isBusy}
                      leftIcon={<EyeOff className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => resolve(report, "hide_listing")}
                    >
                      Skrýt inzerát
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => resolve(report, "dismiss")}
                    >
                      Zamítnout nahlášení
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
