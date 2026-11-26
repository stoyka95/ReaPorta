import Link from "next/link";
import { ArrowRight, Building2, Flag, ShieldCheck, Users } from "lucide-react";
import { getAdminOverview } from "@/db/queries/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "listing.approve": "Schválení inzerátu",
  "listing.reject": "Zamítnutí inzerátu",
  "user.role_change": "Změna role uživatele",
  "user.block": "Zablokování uživatele",
  "user.unblock": "Odblokování uživatele",
  "agency.create": "Vytvoření agentury",
  "agency.update": "Úprava agentury",
  "agency.delete": "Smazání agentury",
  "agent.assign_agency": "Přiřazení makléře",
  "report.resolve_hide_listing": "Skrytí nahlášeného inzerátu",
  "report.dismiss": "Zamítnutí nahlášení",
  "location.update": "Úprava lokality",
};

export default async function AdminOverviewPage() {
  await requirePageAdmin("/admin");
  const overview = await getAdminOverview();

  const kpis = [
    {
      label: "Čeká na moderaci",
      value: overview.pendingListings,
      href: "/admin/moderace",
      cta: "Otevřít frontu",
      icon: ShieldCheck,
      highlight: overview.pendingListings > 0,
    },
    {
      label: "Otevřená nahlášení",
      value: overview.openReports,
      href: "/admin/nahlaseni",
      cta: "Vyřešit nahlášení",
      icon: Flag,
      highlight: overview.openReports > 0,
    },
    {
      label: "Nové registrace (30 dnů)",
      value: overview.newUsers30d,
      href: "/admin/uzivatele",
      cta: "Spravovat uživatele",
      icon: Users,
      highlight: false,
    },
    {
      label: "Aktivní nabídky celkem",
      value: overview.activeListings,
      href: "/prodej/byty",
      cta: "Zobrazit portál",
      icon: Building2,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-eyebrow text-accent-text">Správa portálu</p>
          <h1 className="type-h1 text-strong">Administrace</h1>
          <p className="mt-1 type-body text-muted">
            Celkem {formatNumber(overview.totalUsers)} uživatelů a{" "}
            {formatNumber(overview.totalAgencies)} realitních kanceláří.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="md" asChild>
            <Link href="/admin/moderace">Fronta moderace ({overview.pendingListings})</Link>
          </Button>
          <Button variant="secondary" size="md" asChild>
            <Link href="/admin/nahlaseni">Nahlášení ({overview.openReports})</Link>
          </Button>
        </div>
      </header>

      <section
        aria-label="Klíčové metriky"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.label}
              padding="md"
              className={item.highlight ? "border-violet-300" : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="type-small text-muted">{item.label}</p>
                <Icon
                  className="h-4.5 w-4.5 text-accent-text"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 font-serif text-3xl font-semibold tracking-tight text-strong tabular-nums">
                {formatNumber(item.value)}
              </p>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-1 type-small font-medium text-accent-text hover:underline"
              >
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Card>
          );
        })}
      </section>

      <section aria-labelledby="audit-log-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="audit-log-heading" className="type-h2 text-strong">
              Auditní protokol
            </h2>
            <p className="type-small text-muted">
              Každý zásah správce se automaticky eviduje včetně aktéra a času.
            </p>
          </div>
          <Badge variant="neutral">{overview.recentAudit.length} záznamů</Badge>
        </div>

        {overview.recentAudit.length === 0 ? (
          <EmptyState
            title="Zatím žádné záznamy v auditním protokolu"
            description="Jakmile provedete moderaci, úpravu uživatele nebo vyřešení nahlášení, záznam se zobrazí zde."
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line-subtle bg-subtle type-caption font-semibold text-muted">
                    <th className="px-4 py-3">Akce</th>
                    <th className="px-4 py-3">Entita</th>
                    <th className="px-4 py-3">Správce</th>
                    <th className="px-4 py-3">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle type-small">
                  {overview.recentAudit.map((entry) => (
                    <tr key={entry.id} className="hover:bg-hover/60">
                      <td className="px-4 py-3 font-medium text-strong">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td className="px-4 py-3 text-body">
                        <span className="font-mono type-caption text-muted">
                          {entry.entity}:{entry.entityId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body">
                        {entry.actorName ?? entry.actorEmail ?? "Systém"}
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
