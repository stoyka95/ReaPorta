import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, Home, Inbox, Plus } from "lucide-react";
import { requirePageAgent } from "@/lib/auth/session";
import { getAgentDashboardOverview } from "@/db/queries/dashboard";
import { Badge, Button, Card } from "@/components/ui";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard makléře",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Koncept",
  pending: "Ke schválení",
  rejected: "Zamítnuto",
};

export default async function DashboardOverviewPage() {
  const user = await requirePageAgent("/dashboard");
  const overview = await getAgentDashboardOverview(user.id);

  const kpis = [
    {
      label: "Aktivní inzeráty",
      value: overview.counts.active.toLocaleString("cs-CZ"),
      sub: `Celkem ${overview.counts.total} nabídek`,
      icon: Home,
    },
    {
      label: "Zobrazení (30 dní)",
      value: overview.views30d.toLocaleString("cs-CZ"),
      sub: `${overview.phoneReveals30d}× zobrazen telefon`,
      icon: Eye,
    },
    {
      label: "Nové poptávky",
      value: overview.newInquiriesCount.toLocaleString("cs-CZ"),
      sub: "Čeká na vaši reakci",
      icon: Inbox,
    },
    {
      label: "Ke schválení / koncepty",
      value: String(overview.counts.pending + overview.counts.draft),
      sub: `${overview.counts.pending} v moderaci · ${overview.counts.draft} konceptů`,
      icon: Plus,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="type-eyebrow text-accent-text">Přehled makléře</p>
          <h1 className="mt-1 type-h1 text-strong">Dobrý den, {user.name}</h1>
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

      {/* KPI dlaždice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} padding="md" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="type-caption font-medium text-muted">{kpi.label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 text-accent-text">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </div>
              <p className="font-display text-3xl font-semibold tracking-tight text-strong tnum">
                {kpi.value}
              </p>
              <p className="type-caption text-muted">{kpi.sub}</p>
            </Card>
          );
        })}
      </div>

      {/* Graf zobrazení za posledních 30 dní */}
      <ViewsChart data={overview.dailyViews} />

      {/* Koncepty / čekající / zamítnuté */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="type-h3 text-strong">Vyžaduje pozornost</h2>
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            asChild
          >
            <Link href="/dashboard/inzeraty">Všechny inzeráty</Link>
          </Button>
        </div>

        {overview.attentionListings.length === 0 ? (
          <p className="type-small text-muted">
            Všechny vaše nabídky jsou v pořádku. Nemáte žádné rozpracované koncepty ani zamítnuté
            inzeráty.
          </p>
        ) : (
          <div className="divide-y divide-line-subtle">
            {overview.attentionListings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/inzeraty/${item.id}/upravit`}
                      className="truncate type-body font-medium text-strong hover:text-accent-text hover:underline"
                    >
                      {item.title}
                    </Link>
                    <Badge
                      variant={
                        item.status === "rejected"
                          ? "danger"
                          : item.status === "pending"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Badge>
                  </div>
                  {item.rejectReason ? (
                    <p className="type-caption text-danger">Důvod: {item.rejectReason}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="type-caption text-muted tnum">{formatDate(item.updatedAt)}</span>
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/dashboard/inzeraty/${item.id}/upravit`}>Upravit</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
